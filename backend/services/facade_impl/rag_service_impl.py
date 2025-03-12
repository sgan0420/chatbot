import os
from typing import List
from dotenv import load_dotenv
import pandas as pd
from langchain.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document
import logging
from io import BytesIO
import requests
from services.facade.rag_service import RAGService
from models.request.rag_request import ProcessDocumentsRequest, ChatRequest
from models.response.rag_response import ProcessDocumentsResponse, ChatResponse
from models.response.response_wrapper import SuccessResponse, ErrorResponse

VECTOR_STORE_PATH = "vector_store"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class RAGServiceImpl(RAGService):
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        # Ensure OPENAI_API_KEY exists in environment variables
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Please set OPENAI_API_KEY in the .env file")
        
        try:
            self.embeddings = OpenAIEmbeddings()
            logging.info("Successfully initialized OpenAI Embeddings")
        except Exception as e:
            logging.error(f"Failed to initialize OpenAI Embeddings: {str(e)}")
            raise
            
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.vector_store = None
        self.conversation_chain = None
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # Try to load existing vector store
        if os.path.exists(os.path.join(VECTOR_STORE_PATH, "index.faiss")):
            try:
                self.load_vector_store(VECTOR_STORE_PATH)
                logging.info("Successfully loaded existing vector store")
            except Exception as e:
                logging.info("No existing vector store found")
                self.vector_store = None

    def save_vector_store(self, path: str):
        """Save the vector store for future use"""
        if self.vector_store:
            self.vector_store.save_local(path)
            logging.info(f"Vector store saved to {path}")
        else:
            logging.warning("No vector store to save")

    def load_vector_store(self, path: str):
        """Load a previously saved vector store"""
        if os.path.exists(path):
            self.vector_store = FAISS.load_local(path, self.embeddings)
            logging.info(f"Vector store loaded from {path} directory")
            self._initialize_chain()
        else:
            logging.error(f"Vector store path {path} does not exist")

    def _initialize_chain(self):
        """Initialize the conversation chain"""
        if self.vector_store:
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=ChatOpenAI(temperature=0.7, model_name="gpt-4o-mini"),
                retriever=self.vector_store.as_retriever(search_kwargs={"k": 3}),
                memory=self.memory,
                verbose=True
            )
            logging.info("Conversation chain initialization completed")
        else:
            logging.error("Cannot initialize chain without vector store")

    def process_url_document(self, url: str) -> List[Document]:
        """Process document from URL"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            filename = url.split('/')[-1].split('?')[0]
            file_content = BytesIO(response.content)
            
            if filename.endswith('.pdf'):
                loader = PyPDFLoader(file_content)
                docs = loader.load()
                for idx, page in enumerate(docs):
                    page.metadata.update({
                        "source": url,
                        "page": idx + 1,
                        "total_pages": len(docs)
                    })
                    if not page.page_content.strip():
                        continue
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
                loader = UnstructuredWordDocumentLoader(file_content)
                docs = loader.load()
                for doc in docs:
                    doc.metadata["source"] = url
                logging.info(f"Successfully processed Word file from URL: {url}")
                
            else:
                logging.warning(f"Unsupported file type for URL: {url}")
                return []
            
            return docs
            
        except Exception as e:
            logging.error(f"Error processing file from URL {url}: {str(e)}")
            return []

    def process_documents_from_urls(self, data: ProcessDocumentsRequest) -> tuple[dict, int]:
        """Process multiple documents from URLs"""
        try:
            documents = []
            failed_urls = []
            
            for url in data.urls:
                try:
                    docs = self.process_url_document(str(url))
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
            
            logging.info("Creating vector store...")
            self.vector_store = FAISS.from_documents(
                documents=splits,
                embedding=self.embeddings
            )
            logging.info("Vector store creation completed")

            self.save_vector_store(VECTOR_STORE_PATH)
            logging.info(f"Vector store saved to {VECTOR_STORE_PATH}")

            self._initialize_chain()
            
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
        """Process user query and return response with source citations"""
        if not self.conversation_chain:
            return ErrorResponse(
                message="Knowledge base not loaded successfully"
            ).model_dump(), 400
        
        try:
            result = self.conversation_chain({"question": data.query})
            
            answer = result.get("answer", "Sorry, I couldn't find relevant information.")
            sources = []
            
            if hasattr(result, 'source_documents'):
                source_docs = result.source_documents
                logging.info(f"Found {len(source_docs)} relevant document segments")
                for i, doc in enumerate(source_docs):
                    source = doc.metadata.get('source', 'Unknown source')
                    sources.append(source)
                    logging.info(f"Source {i+1}: {source}")
                    logging.info(f"Content: {doc.page_content[:100]}...")
            
            if sources:
                unique_sources = list(set(sources))
                sources = [os.path.basename(s) for s in unique_sources]
            
            response = ChatResponse(
                answer=answer,
                sources=sources if sources else None
            )
            
            return SuccessResponse(
                data=response.model_dump(),
                message="Chat response generated successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error processing query: {str(e)}")
            return ErrorResponse(
                message="An error occurred while processing your request"
            ).model_dump(), 500 