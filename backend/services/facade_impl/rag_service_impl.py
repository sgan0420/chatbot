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
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from models.request.rag_request import ProcessDocumentsRequest
from models.response.rag_response import ProcessDocumentsResponse
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