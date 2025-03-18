import logging
import os
import tempfile
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
from langchain.prompts.chat import (ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate,
)
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from models.request.rag_request import ChatRequest, RAGServiceRequest
from models.response.rag_response import ChatResponse, ProcessDocumentsResponse
from models.response.response_wrapper import ErrorResponse, SuccessResponse
from PyPDF2 import PdfReader
from datetime import datetime, timezone
from services.facade.rag_service import RAGService

BUCKET_NAME = "DOCUMENTS"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class RAGServiceImpl(RAGService):
    def __init__(self, user_id: str, user_token: str, data: RAGServiceRequest):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Please set OPENAI_API_KEY in the .env file")
        
        self.user_id = user_id
        self.supabase = get_supabase_client(user_token)
        self.chatbot_id = data.chatbot_id
        self.chat_id = data.chat_id
        self.embeddings = OpenAIEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.vector_store = None
        self.conversation_chain = None
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

        # Check if vector store exists in Supabase
        try:
            result = self.supabase.table('chatbots') \
                .select('vector_faiss_url') \
                .eq('id', self.chatbot_id) \
                .execute()
            
            # If no result or vector_faiss_url is None/empty, skip loading
            if not result.data or not result.data[0].get('vector_faiss_url'):
                logging.info("No existing vector store found for this chatbot")
            else:
                # If we have a vector store, try to load it
                self._load_vector_store_from_supabase()
                logging.info("Successfully loaded existing vector store from Supabase")
                # If vector store loaded successfully, also load conversation history
                self._load_conversation_memory()
                logging.info("Successfully loaded existing conversation history from Supabase")

        except Exception as e:
            logging.error(f"Failed to load existing vector store or conversation history: {str(e)}")


    def _load_vector_store_from_supabase(self):
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
            storage_faiss_path = f"chatbot_{self.chatbot_id}/index.faiss"
            storage_pkl_path = f"chatbot_{self.chatbot_id}/index.pkl"

            # Create a temporary directory
            # FAISS needs actual files on disk because:
            # 1. It memory-maps the index file (.faiss) for efficient similarity searches
            # 2. It uses Python's pickle module to load the metadata (.pkl)
            with tempfile.TemporaryDirectory() as temp_dir:
                # Download files directly from Supabase bucket
                faiss_data = self.supabase.storage.from_(BUCKET_NAME).download(storage_faiss_path)
                pkl_data = self.supabase.storage.from_(BUCKET_NAME).download(storage_pkl_path)
                
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


    def _load_conversation_memory(self):
        """Load previous conversations into memory"""
        try:
            result = self.supabase.table('chats') \
                .select('*') \
                .eq('id', self.chat_id) \
                .order('created_at', desc=False) \
                .execute()
            
            # Add messages to memory
            for msg in result.data:
                if msg['is_user']:
                    self.memory.chat_memory.add_user_message(msg['message'])
                else:
                    self.memory.chat_memory.add_ai_message(msg['message'])
                    
            logging.info(f"Loaded {len(result.data)} messages into conversation memory")
        except Exception as e:
            logging.error(f"Error loading conversation memory: {str(e)}")
            # Fall back to empty memory
            self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


    def _save_vector_store(self):
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
                storage_faiss_path = f"chatbot_{self.chatbot_id}/index.faiss"
                storage_pkl_path = f"chatbot_{self.chatbot_id}/index.pkl"
                
                # Upload files directly to bucket
                with open(faiss_path, 'rb') as f:
                    self.supabase.storage.from_(BUCKET_NAME).upload(storage_faiss_path, f)
                with open(pkl_path, 'rb') as f:
                    self.supabase.storage.from_(BUCKET_NAME).upload(storage_pkl_path, f)
                
                logging.info(f"Vector store saved to Supabase storage for chatbot {self.chatbot_id}")
                
        except Exception as e:
            logging.error(f"Error saving vector store to Supabase: {str(e)}")
            raise


    def _save_message(self, message: str, is_user: bool, created_at: str):
        """Save a message to the chats table"""
        try:
            self.supabase.table('chats').insert({
                "id": self.chat_id,
                "chatbot_id": self.chatbot_id,
                "is_user": is_user,
                "message": message,
                "created_at": created_at
            }).execute()
            logging.info(f"Saved {'user' if is_user else 'AI'} message to database")
        except Exception as e:
            logging.error(f"Error saving message to database: {str(e)}")


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


    def process_documents_from_urls(self) -> tuple[dict, int]:
        """Process documents from URLs (from the documents table in Supabase)"""
        # Get document URLs from documents table for this chatbot 
        try:
            result = self.supabase.table('documents') \
                .select('file_url') \
                .eq('chatbot_id', self.chatbot_id) \
                .execute()
                
            if not result.data:
                return ErrorResponse(
                    message="No documents found for this chatbot"
                ).model_dump(), 404
                
            # Extract URLs from the result
            urls = [doc['file_url'] for doc in result.data]
            
            documents = []
            failed_urls = []
            
            for url in urls:  # Using URLs from Supabase instead of request
                try:
                    docs = self._process_url_document(str(url))
                    if docs:
                        documents.extend(docs)
                    else:
                        failed_urls.append(str(url))
                except Exception as e:
                    logging.error(f"Error processing URL {url}: {str(e)}")
                    failed_urls.append(str(url))
                    continue

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
            
            self._initialize_conversation_chain()
            self._save_vector_store()
            response = ProcessDocumentsResponse(
                processed_count=len(documents),
                failed_urls=failed_urls
            )
            
            return SuccessResponse(
                data=response.model_dump(),
                message="Documents processed successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing documents from URLs: {str(e)}")
            return ErrorResponse(
                message=str(e)
            ).model_dump(), 500


    def chat(self, data: ChatRequest) -> tuple[dict, int]:
        """Process user query and return response"""
        if not self.vector_store or not self.conversation_chain:
            return ErrorResponse(
                message="No vector store or conversation chain found"
            ).model_dump(), 400

        try:
            # Save user message first
            self._save_message(data.query, is_user=True)
            
            # Get AI response
            result = self.conversation_chain({"question": data.query})
            answer = result.get("answer", "Sorry, I couldn't find relevant information.")
            timestamp = datetime.now(timezone.utc).isoformat()
            
            self._save_message(answer, False, timestamp)            
            response = ChatResponse(answer)

            return SuccessResponse(
                data=response.model_dump(),
                message="Chat response generated successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing query: {str(e)}")
            return ErrorResponse(
                message="An error occurred while processing your request"
            ).model_dump(), 500


    def get_chat_history(self) -> tuple[dict, int]:
        """Get chat history for a specific chatbot"""
        try:
            result = self.supabase.table('chats') \
                .select('*') \
                .eq('id', self.chat_id) \
                .order('created_at', desc=False) \
                .execute()
            return SuccessResponse(
                data={"messages": result.data},
                message="Chat history retrieved successfully"
            ).model_dump(), 200
        except Exception as e:
            logging.error(f"Error retrieving chat history: {str(e)}")
            return ErrorResponse(
                message=str(e)
            ).model_dump(), 500
