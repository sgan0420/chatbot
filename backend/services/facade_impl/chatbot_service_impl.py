import uuid
from models.request.chatbot_request import UploadDocumentRequest, DeleteDocumentRequest
from config import get_supabase_client
from exceptions.database_exception import DatabaseException
from models.response.chatbot_response import ChatbotListResponse, DocumentListResponse, Chatbot, CreateChatbotResponse
from models.response.response_wrapper import SuccessResponse, ErrorResponse
from services.facade.chatbot_service import ChatbotService
import logging

BUCKET_NAME = "DOCUMENTS"

class ChatbotServiceImpl(ChatbotService):
    def __init__(self, user_token=None):
        self.supabase = get_supabase_client(user_token)

    def get_user_chatbots(self, user_id: str) -> tuple:
        logging.info(f"Fetching chatbots for user: {user_id}")
        try:
            response = (
                self.supabase.table("chatbots")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            chatbot_list_response = ChatbotListResponse(chatbots=response.data)
            logging.info(f"Chatbots fetched successfully: {chatbot_list_response}")

        except Exception as e:
            raise DatabaseException("Error fetching chatbots", data={"error": str(e)})

        return SuccessResponse(data=chatbot_list_response).model_dump(), 200

    def create_chatbot(self, user_id: str, data: dict) -> tuple:
        logging.info(f"Creating a new chatbot for user: {user_id}")
        try:
            chatbot_data = {
                "user_id": user_id,
                "name": data.name,
                "description": data.description,
            }
            response = (
                self.supabase.table("chatbots")
                .insert(chatbot_data)
                .execute()
            )
            chatbot_response = CreateChatbotResponse(
                id=response.data[0]["id"],
                user_id=user_id,
                name=data.name,
                description=data.description,
                created_at=response.data[0]["created_at"],
                updated_at=response.data[0]["updated_at"]
            )
            return SuccessResponse(
                data=chatbot_response,
                message="Chatbot created successfully"
            ).model_dump(), 201

        except Exception as e:
            raise DatabaseException("Error creating chatbot", data={"error": str(e)})

    def get_chatbot(self, chatbot_id: str) -> tuple:
        """Get a single chatbot by ID"""
        logging.info(f"Fetching chatbot with ID: {chatbot_id}")
        try:
            response = (
                self.supabase.table("chatbots")
                .select("*")
                .eq("id", chatbot_id)
                .single()
                .execute()
            )
            
            # Check if a chatbot was found
            if not response.data:
                logging.warning(f"No chatbot found with ID: {chatbot_id}")
                return ErrorResponse(
                    message="Chatbot not found"
                ).model_dump(), 404
                
            chatbot_response = Chatbot(
                id=response.data["id"],
                user_id=response.data["user_id"],
                name=response.data["name"],
                description=response.data["description"],
                created_at=response.data["created_at"],
                updated_at=response.data["updated_at"]
            )
            logging.info(f"Chatbot fetched successfully: {chatbot_response}")
            
            return SuccessResponse[Chatbot](
                data=chatbot_response,
                message="Chatbot fetched successfully"
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error fetching chatbot: {str(e)}")
            raise DatabaseException("Error fetching chatbot", data={"error": str(e)})
        
    def update_chatbot(self, chatbot_id: str, data: dict) -> tuple:
        """Update a chatbot's name and description"""
        logging.info(f"Updating chatbot {chatbot_id} with data: {data}")
        try:
            # Update only the name and description fields
            update_data = {
                "name": data.get("name"),
                "description": data.get("description"),
            }
            response = (
                self.supabase.table("chatbots")
                .update(update_data)
                .eq("id", chatbot_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                updated = response.data[0]
                # Build a Chatbot model using updated data
                chatbot_response = Chatbot(
                    id=updated["id"],
                    user_id=updated["user_id"],
                    name=updated["name"],
                    description=updated["description"],
                    created_at=updated["created_at"],
                    updated_at=updated["updated_at"],
                )
                logging.info(f"Chatbot updated successfully: {chatbot_response}")
                return SuccessResponse(
                    data=chatbot_response, 
                    message="Chatbot updated successfully"
                ).model_dump(), 200
            else:
                logging.warning(f"Chatbot {chatbot_id} not found")
                return ErrorResponse(message="Chatbot not found").model_dump(), 404
        except Exception as e:
            logging.error(f"Error updating chatbot: {str(e)}")
            raise DatabaseException("Error updating chatbot", data={"error": str(e)})

    def delete_chatbot(self, user_id, chatbot_id):
        """Delete chatbot and all associated documents."""
        try:
            folders = [f"{user_id}/{chatbot_id}/document/", f"{user_id}/{chatbot_id}/rag-vector/"]
            for folder_path in folders:
                files = self.supabase.storage.from_(BUCKET_NAME).list(folder_path)
                file_paths = [f"{folder_path}{file['name']}" for file in files if 'name' in file]
                if file_paths:
                    self.supabase.storage.from_(BUCKET_NAME).remove(file_paths)
            self.supabase.table("chatbots").delete().eq("id", chatbot_id).execute()
            self.supabase.table("documents").delete().eq("chatbot_id", chatbot_id).execute()
            logging.info(f"Chatbot {chatbot_id} and its folder deleted successfully.")
            return SuccessResponse(message="Chatbot deleted successfully.").model_dump(),200
        except Exception as e:
            raise DatabaseException("Error deleting chatbots", data={"error": str(e)})


    def upload_document(self, user_id: str, data: UploadDocumentRequest) -> tuple:
        """Upload a document to Supabase bucket"""
        try:
            document_id = str(uuid.uuid4())
            chatbot_id = data.chatbot_id
            file = data.file
            file_name = file.filename
            file_type = file_name.split(".")[-1]
            bucket_path = f"{user_id}/{chatbot_id}/document/{file_name}"

            # Check if a document with the same name exists
            result = self.supabase.table("documents") \
                .select("id") \
                .eq("chatbot_id", chatbot_id) \
                .eq("file_name", file_name) \
                .execute()
            
            # If the document already exists, replace it (remove it first and then upload the new one)
            if result.data:
                logging.info(f"Document {file_name} already exists, removing it first")
                self.supabase.storage.from_(BUCKET_NAME).remove([bucket_path])
                self.supabase.table("documents").delete().eq("id", result.data[0]["id"]).execute()

            # Upload the new file to storage bucket
            file_content = file.read()
            self.supabase.storage.from_(BUCKET_NAME).upload(bucket_path, file_content)

            file.seek(0) # Reset file pointer for potential future use

            document_data = {
                "id": document_id,
                "chatbot_id": chatbot_id,
                "file_name": file_name,
                "file_type": file_type,
                "bucket_path": bucket_path,
            }

            self.supabase.table("documents").insert(document_data).execute()

            return SuccessResponse(
                message="Document uploaded successfully"
            ).model_dump(), 200
            
        except Exception as e:
            return ErrorResponse(
                message=f"Error uploading document: {str(e)}"
            ).model_dump(), 500
        

    def list_documents(self, chatbot_id: str) -> tuple:
        try:
            response = (
                self.supabase.table("documents")
                .select("*")
                .eq("chatbot_id", chatbot_id)
                .execute()
            )
            
            document_list_response = DocumentListResponse(documents=response.data)

        except Exception as e:
            raise DatabaseException("Error fetching documents", data={"error": str(e)})
        
        return SuccessResponse(data=document_list_response).model_dump(), 200
    
    def delete_document(self, user_id: str, data: DeleteDocumentRequest) -> tuple:
        try:
            document_id = data.document_id
            chatbot_id = data.chatbot_id
            
            # Check if this is the only document for this chatbot
            document_count_result = self.supabase.table("documents") \
                .select("*", count="exact") \
                .eq("chatbot_id", chatbot_id) \
                .neq("file_type", "faiss") \
                .neq("file_type", "pkl") \
                .execute()
                
            document_count = document_count_result.count if hasattr(document_count_result, "count") else 0
            
            # If this is the only document, don't allow deletion
            if document_count <= 1:
                return ErrorResponse(
                    message="Cannot delete the last document. A chatbot must have at least one document.",
                    data={"error": "last_document"}
                ).model_dump(), 400
            
            file_name = self.supabase.table("documents").select("file_name").eq("id", document_id).single().execute().data["file_name"]
            bucket_path = f"{user_id}/{chatbot_id}/document/{file_name}"
            
            # Remove the document from the bucket
            self.supabase.storage.from_(BUCKET_NAME).remove([bucket_path])
            
            # Delete the document from the database
            self.supabase.table("documents").delete().eq("id", document_id).execute()
            
            # We need to rebuild the vector store, so:
            # 1. Delete the existing vector store files if they exist
            vector_paths = [
                f"{user_id}/{chatbot_id}/rag-vector/index.faiss",
                f"{user_id}/{chatbot_id}/rag-vector/index.pkl"
            ]
            
            # Check if vector files exist before attempting to delete
            vector_docs = self.supabase.table("documents") \
                .select("id") \
                .eq("chatbot_id", chatbot_id) \
                .in_("file_name", ["index.faiss", "index.pkl"]) \
                .execute()
                
            if vector_docs.data:
                # Delete vector files from storage
                try:
                    self.supabase.storage.from_(BUCKET_NAME).remove(vector_paths)
                except Exception as storage_error:
                    logging.warning(f"Error removing vector files from storage: {str(storage_error)}")
                
                # Delete vector entries from database
                self.supabase.table("documents") \
                    .delete() \
                    .eq("chatbot_id", chatbot_id) \
                    .in_("file_name", ["index.faiss", "index.pkl"]) \
                    .execute()
            
            # 2. Mark all remaining documents for this chatbot as unprocessed
            self.supabase.table("documents") \
                .update({"is_processed": False}) \
                .eq("chatbot_id", chatbot_id) \
                .neq("file_type", "faiss") \
                .neq("file_type", "pkl") \
                .execute()
            
            return SuccessResponse(
                message="Document deleted successfully. Vector store needs manual rebuilding.",
                data={"requires_reprocessing": True}
            ).model_dump(), 200
        
        except Exception as e:
            logging.error(f"Error deleting document: {str(e)}")
            raise DatabaseException("Error deleting document", data={"error": str(e)})
            
    
    def rebuild_vector_store(self, user_id: str, user_token: str, chatbot_id: str) -> tuple:
        try:
            from services.facade_impl.rag_service_impl import RAGServiceImpl
            from models.request.rag_request import ProcessDocumentsRequest

            # Create a new RAG service instance
            rag_service = RAGServiceImpl()

            # Create a request to process documents
            process_request = ProcessDocumentsRequest(chatbot_id=chatbot_id)
            
            # Process the documents
            try:
                rag_service.process_documents_from_urls(
                    user_id=user_id, 
                    user_token=user_token, 
                    data=process_request
                )
                
            except Exception as process_error:
                logging.error(f"Error processing documents: {str(process_error)}")
                return ErrorResponse(
                    message="Error rebuilding vector store",
                    data={"error_rebuilding": str(process_error)}
                ).model_dump(), 500
            
            return SuccessResponse(
                message="Vector store rebuilt successfully",
                data={"vector_store_updated": True}
            ).model_dump(), 200
            
        except Exception as e:
            logging.error(f"Error rebuilding vector store: {str(e)}")
            raise DatabaseException("Error rebuilding vector store", data={"error": str(e)})
