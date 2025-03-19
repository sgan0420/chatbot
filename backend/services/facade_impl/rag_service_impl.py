import logging
import os
import tempfile
import uuid
from io import BytesIO
from typing import List

import docx
import pandas as pd
import requests
from config import get_supabase_client
from dotenv import load_dotenv
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from models.request.rag_request import ChatRequest, ProcessDocumentsRequest, GetChatHistoryRequest
from models.response.rag_response import ChatResponse, ProcessDocumentsResponse
from models.response.response_wrapper import ErrorResponse, SuccessResponse
from PyPDF2 import PdfReader
from services.facade.rag_service import RAGService
from supabase import Client

BUCKET_NAME = "DOCUMENTS"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class RAGServiceImpl(RAGService):
    def __init__(self):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Please set OPENAI_API_KEY in the .env file")
        self.embeddings = OpenAIEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.vector_store = None
        self.conversation_chain = None
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


    def _load_vector_store_from_supabase(self, user_id: str, chatbot_id: str, supabase: Client):
        """Load vector store from Supabase URLs"""
        # There are two files saved, index.faiss and index.pkl
        # index.faiss: contains the actual vector embeddings, stores the numerical vectors in FAISS's optimized format, used for similarity searching.
        # index.pkl: contains the metadata and mapping information, stores the original texts and their metadata, maps vectors back to their original content.
        # .faiss is "search engine" part and .pkl is lookup table.
        # index.faiss:
        # [0.1, 0.2, 0.3, ...] → Vector ID: 1
        # [0.4, 0.5, 0.6, ...] → Vector ID: 2
        # [0.7, 0.8, 0.9, ...] → Vector ID: 3
        # index.pkl:
        # Vector ID: 1 → {"text": "This is the first document", "source": "doc1.pdf"}
        # Vector ID: 2 → {"text": "This is the second document", "source": "doc2.pdf"}
        # Vector ID: 3 → {"text": "This is the third document", "source": "doc3.pdf"}

        # Without .faiss, you can't perform similarity searches
        # Without .pkl, you can't retrieve the original content that matches the vectors
        try:
            storage_faiss_path = f"{user_id}/{chatbot_id}/rag-vector/index.faiss"
            storage_pkl_path = f"{user_id}/{chatbot_id}/rag-vector/index.pkl"

            # Create a temporary directory
            # FAISS needs actual files on disk because:
            # 1. It memory-maps the index file (.faiss) for efficient similarity searches
            # 2. It uses Python's pickle module to load the metadata (.pkl)
            with tempfile.TemporaryDirectory() as temp_dir:
                # Download files directly from Supabase bucket
                faiss_data = supabase.storage.from_(BUCKET_NAME).download(storage_faiss_path)
                pkl_data = supabase.storage.from_(BUCKET_NAME).download(storage_pkl_path)
                
                faiss_path = os.path.join(temp_dir, "index.faiss")
                pkl_path = os.path.join(temp_dir, "index.pkl")
                
                # Save files temporarily
                with open(faiss_path, 'wb') as f:
                    f.write(faiss_data)
                with open(pkl_path, 'wb') as f:
                    f.write(pkl_data)
                
                # Load vector store from temporary files
                self.vector_store = FAISS.load_local(temp_dir, self.embeddings)
                self._initialize_conversation_chain()
                
        except Exception as e:
            logging.error(f"Error loading vector store from Supabase: {str(e)}")
            raise


    def _initialize_conversation_chain(self):
        if self.vector_store:
            # Define your custom system template
            system_template = """You are a helpful AI assistant. Use the following pieces of context to answer the user's questions.
            Always try to answer the question based on the context (the documents/vectors you have access to) and the current conversation.
            If you don't know the answer, just notify the user to be more specific.
                        
            Context: {context}
            
            Current conversation:
            {chat_history}
            """
            
            # Create prompt templates
            system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
            human_template = "{question}"
            human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
            
            chat_prompt = ChatPromptTemplate.from_messages([
                system_message_prompt,
                human_message_prompt,
            ])
            
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=ChatOpenAI(temperature=0.7, model_name="gpt-4o-mini"),
                retriever=self.vector_store.as_retriever(search_kwargs={"k": 3}),
                memory=self.memory,
                combine_docs_chain_kwargs={"prompt": chat_prompt},
                verbose=True
        )
            logging.info("Conversation chain initialization completed")
        else:
            logging.error("Cannot initialize chain without vector store")


    def _load_conversation_memory(self, chatbot_id: str, session_id: str, supabase: Client):
        """Load previous conversations into memory"""
        try:
            # Get user messages
            user_result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .eq('user_type', 'user') \
                .order('created_at') \
                .execute()

            # Get AI messages
            ai_result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .eq('user_type', 'bot') \
                .order('created_at') \
                .execute()
            
            if not (user_result.data or ai_result.data):
                logging.info("No conversation history found for this chat")
            else:
                # Add messages to memory
                # LangChain API's add_user_message and add_ai_message methods only accept one message at a time. 
                for msg in user_result.data:
                    self.memory.chat_memory.add_user_message(msg['message'])
                for msg in ai_result.data:
                    self.memory.chat_memory.add_ai_message(msg['message'])
                    
                total_messages = len(user_result.data) + len(ai_result.data)
                logging.info(f"Loaded {total_messages} messages into conversation memory")
        except Exception as e:
            logging.error(f"Error loading conversation memory: {str(e)}")
            # Fall back to empty memory
            self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


    def _save_vector_store(self, user_id: str, chatbot_id: str, supabase: Client):
        """Save vector store to Supabase storage"""
        if not self.vector_store:
            logging.warning("No vector store to save")
            return
        try:
            # Create a temporary directory to save files
            with tempfile.TemporaryDirectory() as temp_dir:
                # Save vector store locally first
                self.vector_store.save_local(temp_dir)
                
                # Upload both files to Supabase storage
                faiss_path = os.path.join(temp_dir, "index.faiss")
                pkl_path = os.path.join(temp_dir, "index.pkl")
                
                # Define storage paths
                storage_faiss_path = f"{user_id}/{chatbot_id}/rag-vector/index.faiss"
                storage_pkl_path = f"{user_id}/{chatbot_id}/rag-vector/index.pkl"
                
                # Upload files directly to bucket
                with open(faiss_path, 'rb') as f:
                    supabase.storage.from_(BUCKET_NAME).upload(storage_faiss_path, f)
                with open(pkl_path, 'rb') as f:
                    supabase.storage.from_(BUCKET_NAME).upload(storage_pkl_path, f)
                
                logging.info(f"Vector store saved to Supabase bucket for chatbot {chatbot_id}")

                # add two rows to the documents table
                supabase.table('documents').insert({
                    'id': str(uuid.uuid4()),
                    'chatbot_id': chatbot_id,
                    'file_name': 'index.faiss',
                    'file_type': 'faiss',
                    'is_processed': True,
                    'bucket_path': storage_faiss_path
                }).execute()

                supabase.table('documents').insert({
                    'id': str(uuid.uuid4()),
                    'chatbot_id': chatbot_id,
                    'file_name': 'index.pkl',
                    'file_type': 'pkl',
                    'is_processed': True,
                    'bucket_path': storage_pkl_path
                }).execute()
                
                logging.info(f"Added two rows to the documents table for chatbot {chatbot_id}")
                
        except Exception as e:
            logging.error(f"Error saving vector store to Supabase: {str(e)}")
            raise


    def _save_message(self, chatbot_id: str, session_id: str, is_user: bool, message: str, supabase: Client):
        """Save a message to the chats table """
        try:
            # add a new row to the chats table
            supabase.table('chats').insert({
                'id': str(uuid.uuid4()),
                'chatbot_id': chatbot_id,
                'session_id': session_id,
                'user_type': 'user' if is_user else 'bot',
                'message': message,
            }).execute()
            logging.info(f"Saved {'user' if is_user else 'AI'} message to chat session {session_id}")
        except Exception as e:
            logging.error(f"Error saving message to chat session {session_id}: {str(e)}")
            raise  # Re-raise to handle in the calling function


    def _process_url_document(self, url: str) -> List[Document]:
        """Process document from URL"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            filename = url.split('/')[-1].split('?')[0]
            file_content = BytesIO(response.content)
            
            if filename.endswith('.pdf'):
                pdf_reader = PdfReader(file_content)
                docs = []
                for idx, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if text.strip():  # Skip empty pages
                        docs.append(Document(
                            page_content=text,
                            metadata={
                                "source": url,
                                "page": idx + 1,
                                "total_pages": len(pdf_reader.pages)
                            }
                        ))
                logging.info(f"Successfully processed PDF file from URL: {url}")
                
            elif filename.endswith('.txt'):
                content = file_content.read().decode('utf-8')
                docs = [Document(
                    page_content=content,
                    metadata={"source": url}
                )]
                logging.info(f"Successfully processed text file from URL: {url}")
                
            elif filename.endswith('.csv'):
                df = pd.read_csv(file_content)
                docs = []
                for idx, row in df.iterrows():
                    content = f"Product Record #{idx + 1}\n"
                    for col in df.columns:
                        content += f"{col}: {row[col]}\n"
                    doc = Document(
                        page_content=content,
                        metadata={"source": url, "row": idx}
                    )
                    docs.append(doc)
                logging.info(f"Successfully processed CSV file from URL: {url}")
                
            elif filename.endswith('.md'):
                content = file_content.read().decode('utf-8')
                docs = [Document(
                    page_content=content,
                    metadata={"source": url}
                )]
                logging.info(f"Successfully processed markdown file from URL: {url}")
                
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_content)
                docs = []
                for idx, row in df.iterrows():
                    content = f"Record #{idx + 1}\n"
                    for col in df.columns:
                        content += f"{col}: {row[col]}\n"
                    doc = Document(
                        page_content=content,
                        metadata={"source": url, "row": idx}
                    )
                    docs.append(doc)
                logging.info(f"Successfully processed Excel file from URL: {url}")
                
            elif filename.endswith(('.docx', '.doc')):
                doc = docx.Document(file_content)
                content = []
                for para in doc.paragraphs:
                    if para.text.strip():  # Skip empty paragraphs
                        content.append(para.text)
                
                # Join all paragraphs with newlines
                full_content = '\n'.join(content)
                docs = [Document(
                    page_content=full_content,
                    metadata={"source": url}
                )]
                logging.info(f"Successfully processed Word file from URL: {url}")
                
            else:
                logging.warning(f"Unsupported file type for URL: {url}")
                return []
            
            return docs
            
        except Exception as e:
            logging.error(f"Error processing file from URL {url}: {str(e)}")
            return []


    def process_documents_from_urls(self, user_id: str, user_token: str, data: ProcessDocumentsRequest) -> tuple[dict, int]:
        """Process documents from URLs (from the documents table in Supabase)"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        # Get document URLs from documents table for newly uploaded documents (is_processed = False)
        try:
            result = supabase.table('documents') \
                .select('bucket_path') \
                .eq('chatbot_id', chatbot_id) \
                .eq('is_processed', False) \
                .execute()
                
            if not result.data:
                return ErrorResponse(
                    message="No documents found for this chatbot"
                ).model_dump(), 404
            
            documents = []
            failed_urls = []

            for doc in result.data:
                bucket_path = doc['bucket_path']
                # Get url from bucket_path
                url = supabase.storage.from_(BUCKET_NAME).create_signed_url(bucket_path, 3600)['signedURL']
                # Process the file url
                docs = self._process_url_document(url)
                if docs:
                    documents.extend(docs)
                else:
                    failed_urls.append(str(url))

            if not documents:
                return ErrorResponse(
                    message="No documents were successfully processed",
                    data={"failed_urls": failed_urls}
                ).model_dump(), 400

            logging.info("Starting document splitting...")
            splits = self.text_splitter.split_documents(documents)
            logging.info(f"Document splitting completed, generated {len(splits)} segments")

            # If there is an existing vector store, append new documents to it
            if self.vector_store:
                self.vector_store.add_documents(splits)
                logging.info("Appended new documents to the existing vector store")
            # If there is no existing vector store, create a new one
            else:
                self.vector_store = FAISS.from_documents(documents=splits, embedding=self.embeddings)
                logging.info("Created a new vector store with the new documents")
            
            # Update is_processed to True for the newly processed documents
            supabase.table('documents') \
                .update({'is_processed': True}) \
                .eq('chatbot_id', chatbot_id) \
                .execute()
            
            self._initialize_conversation_chain()
            self._save_vector_store(user_id, chatbot_id, supabase)
            
            return SuccessResponse(
                data=ProcessDocumentsResponse(
                    processed_count=len(documents),
                    failed_urls=failed_urls
                ).model_dump(),
                message="Documents processed successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing documents from URLs: {str(e)}")
            return ErrorResponse(
                message=str(e)
            ).model_dump(), 500


    def chat(self, user_id: str, user_token: str, data: ChatRequest) -> tuple[dict, int]:
        """Process user query and return response"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        session_id = data.session_id
        query = data.query
        # Check if vector store exists in Supabase
        try:
            result = supabase.table('documents') \
                .select('*') \
                .eq('chatbot_id', chatbot_id) \
                .eq('file_type', 'faiss') \
                .single() \
                .execute()
            # If no result, skip loading
            if not result.data:
                logging.info("No existing vector store found for this chatbot")
                return ErrorResponse(
                    message="No vector store found for this chatbot"
                ).model_dump(), 400
            else:
                self._load_vector_store_from_supabase(user_id, chatbot_id, supabase)
                logging.info("Successfully loaded existing vector store from Supabase")
                self._load_conversation_memory(chatbot_id, session_id, supabase)
                logging.info("Successfully loaded existing conversation history from Supabase")
        except Exception as e:
            logging.error(f"Failed to load existing vector store or conversation history: {str(e)}")

        try:
            # Save user message first
            self._save_message(chatbot_id, session_id, True, query, supabase)
            
            # Get AI response
            result = self.conversation_chain({"question": query})
            answer = result.get("answer", "Sorry, I couldn't find relevant information.")
            
            self._save_message(chatbot_id, session_id, False, answer, supabase)

            return SuccessResponse(
                data=ChatResponse(
                    answer=answer
                ).model_dump(),
                message="Chat response generated successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing query: {str(e)}")
            return ErrorResponse(
                message="An error occurred while processing your request"
            ).model_dump(), 500


    def get_chat_history(self, user_id: str, user_token: str, data: GetChatHistoryRequest) -> tuple[dict, int]:
        """Get chat history for a specific chat session"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        session_id = data.session_id
        try:
            result = supabase.table('chats') \
                .select('message') \
                .eq('chatbot_id', chatbot_id) \
                .eq('session_id', session_id) \
                .execute()

            if not result.data:
                return SuccessResponse(
                    data={"messages": []},
                    message="No chat history found"
                ).model_dump(), 200

            return SuccessResponse(
                data={"messages": result.data},
                message="Chat history retrieved successfully"
            ).model_dump(), 200
        except Exception as e:
            logging.error(f"Error retrieving chat history: {str(e)}")
            return ErrorResponse(
                message=str(e)
            ).model_dump(), 500
