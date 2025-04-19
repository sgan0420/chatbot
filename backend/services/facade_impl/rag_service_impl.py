import logging
import os
import shutil
import tempfile
import uuid
from io import BytesIO

import chardet
import requests
from config import get_supabase_client
from dotenv import load_dotenv
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from models.request.rag_request import ProcessDocumentsRequest
from models.response.rag_response import ProcessDocumentsResponse
from models.response.response_wrapper import ErrorResponse, SuccessResponse
from services.facade.rag_service import RAGService
from services.facade_impl.csv_processor import CSVProcessor
from services.facade_impl.excel_processor import ExcelProcessor
from services.facade_impl.pdf_processor import PDFProcessor
from services.facade_impl.word_processor import WordProcessor
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
            separators=["\n\n", "\n\n\n"]
        )
        self.vector_store = None


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
                
                faiss_path = os.path.join(temp_dir, "index.faiss")
                pkl_path = os.path.join(temp_dir, "index.pkl")
                
                # Define storage paths
                storage_faiss_path = f"{user_id}/{chatbot_id}/rag-vector/index.faiss"
                storage_pkl_path = f"{user_id}/{chatbot_id}/rag-vector/index.pkl"
                
                # Check if the files already exist in the bucket
                result = supabase.table('documents') \
                    .select('id') \
                    .eq('chatbot_id', chatbot_id) \
                    .eq('file_name', 'index.faiss') \
                    .execute()
                
                if result.data:
                    logging.info(f"Vector store files already exist in the bucket, removing them first")
                    supabase.storage.from_(BUCKET_NAME).remove([storage_faiss_path, storage_pkl_path])
                    supabase.table('documents').delete().eq('chatbot_id', chatbot_id).eq('file_name', 'index.faiss').execute()
                    supabase.table('documents').delete().eq('chatbot_id', chatbot_id).eq('file_name', 'index.pkl').execute()

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

    def _process_url_document(self, url: str) -> Document:
        temp_dir = None
        try:
            response = requests.get(url)
            response.raise_for_status()  # Raise an error if download fails
            
            filename = url.split('/')[-1].split('?')[0]
            file_content = BytesIO(response.content)
            file_type = os.path.splitext(filename)[1].lower()  # e.g. .txt, .pdf, .docx, .doc, .csv, .xlsx, .xls
            
            # Create base metadata
            metadata = {
                'source': url,
                'file_type': file_type.lstrip('.'),
                'file_name': filename,
                'content_type': response.headers.get('Content-Type', ''),
            }

            # Create a temp directory for processing
            temp_dir = tempfile.mkdtemp()  # Create temp dir outside the with block for proper cleanup
            temp_file_path = os.path.join(temp_dir, filename)
            
            # Save the file content to temp file
            file_content.seek(0)
            with open(temp_file_path, 'wb') as f:
                f.write(file_content.read())
            
            # Process the file
            if file_type == '.txt':
                # Try to detect encoding
                with open(temp_file_path, 'rb') as f:
                    raw_data = f.read()
                    result = chardet.detect(raw_data)
                    encoding = result['encoding'] if result['encoding'] else 'utf-8'
                
                with open(temp_file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    return Document(
                        page_content=content,
                        metadata=metadata
                    )
            elif file_type == '.pdf':
                return Document(
                    page_content=PDFProcessor(temp_file_path).process_file(),
                    metadata=metadata
                )
            elif file_type == '.csv':
                return Document(
                    page_content=CSVProcessor(temp_file_path).process_file(),
                    metadata=metadata
                )
            elif file_type == '.xlsx' or file_type == '.xls':
                return Document(
                    page_content=ExcelProcessor(temp_file_path).process_file(),
                    metadata=metadata
                )
            elif file_type == '.docx' or file_type == '.doc':
                return Document(
                    page_content=WordProcessor(temp_file_path).process_file(),
                    metadata=metadata
                )
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
        except Exception as e:
            logging.error(f"Error processing document from URL: {str(e)}")
            raise
        
        finally:
            # Clean up temp directory if used
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except Exception as e:
                    logging.warning(f"Failed to clean up temporary directory: {str(e)}")


    def process_documents_from_urls(self, user_id: str, user_token: str, data: ProcessDocumentsRequest) -> tuple[dict, int]:
        """Process documents from URLs (from the documents table in Supabase)"""
        supabase = get_supabase_client(user_token)
        chatbot_id = data.chatbot_id
        
        try:
            # Get document URLs from documents table for newly uploaded documents
            result = supabase.table('documents') \
                .select('bucket_path') \
                .eq('chatbot_id', chatbot_id) \
                .eq('is_processed', False) \
                .execute()
                
            if not result.data:
                return ErrorResponse(
                    message="No unprocessed documents found for this chatbot"
                ).model_dump(), 404
            
            documents = []
            failed_urls = []

            for doc in result.data:
                bucket_path = doc['bucket_path']
                # Get url from bucket_path
                url = supabase.storage.from_(BUCKET_NAME).create_signed_url(bucket_path, 3600)['signedURL']
                
                try:
                    # Process the file url
                    document = self._process_url_document(url)
                    if document:
                        # Update is_processed to True for the newly processed documents
                        supabase.table('documents') \
                            .update({'is_processed': True}) \
                            .eq('bucket_path', bucket_path) \
                            .execute()
                        logging.info(f"Successfully processed document {url}")
                        # Split the document into chunks
                        chunks = self.text_splitter.split_documents([document])
                        documents.extend(chunks)
                except Exception as e:
                    logging.error(f"Failed to process document {url}: {str(e)}")
                    failed_urls.append(str(url))

            if not documents:
                return ErrorResponse(
                    message="No documents were successfully processed",
                    data={"failed_urls": failed_urls}
                ).model_dump(), 400

            logging.info(f"Successfully split documents into {len(documents)} chunks")

            # If there is an existing vector store, append new documents to it
            if self.vector_store:
                self.vector_store.add_documents(documents)
                logging.info("Appended new documents to the existing vector store")
            # If there is no existing vector store, create a new one
            else:
                self.vector_store = FAISS.from_documents(documents=documents, embedding=self.embeddings)
                logging.info("Created a new vector store with the new documents")
            
            # Save the vector store to Supabase bucket
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
        

if __name__ == "__main__":
    url = "https://lkodywmfigqsukjjcyeo.supabase.co/storage/v1/object/sign/DOCUMENTS/2498aa0a-2a68-424d-8d84-18e56267fb21/a0815493-55fc-4fcf-bafe-89b23aae551a/document/testfile_sample_product.txt?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJET0NVTUVOVFMvMjQ5OGFhMGEtMmE2OC00MjRkLThkODQtMThlNTYyNjdmYjIxL2EwODE1NDkzLTU1ZmMtNGZjZi1iYWZlLTg5YjIzYWFlNTUxYS9kb2N1bWVudC90ZXN0ZmlsZV9zYW1wbGVfcHJvZHVjdC50eHQiLCJpYXQiOjE3NDUwNDQ0NzYsImV4cCI6MTc0NTEzMDg3Nn0.Ke0Vn6YNbA93S8P4Z8B93li_sZFkgPDJPAs88YfYbYU"
    print(RAGServiceImpl()._process_url_document(url))

