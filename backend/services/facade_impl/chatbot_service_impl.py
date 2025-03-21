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
            documents = self.supabase.table("documents").select("file_name").eq("chatbot_id", chatbot_id).execute().data

            for document in documents:
                file_path = f"{user_id}/{chatbot_id}/document/{document['file_name']}"
                self.supabase.storage.from_(BUCKET_NAME).remove([file_path])

            self.supabase.table("chatbots").delete().eq("id", chatbot_id).execute()

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

            file_content = file.read()
            
            # Upload the file to storage bucket
            self.supabase.storage.from_(BUCKET_NAME).upload(bucket_path, file_content)

            file.seek(0) # Reset file pointer for potential future use

            # Save document metadata to database
            document_data = {
                "id": document_id,
                "chatbot_id": chatbot_id,
                "file_name": file_name,
                "file_type": file_type,
                "bucket_path": bucket_path
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
            file_name = self.supabase.table("documents").select("file_name").eq("id", document_id).single().execute().data["file_name"]
            bucket_path = f"{user_id}/{chatbot_id}/document/{file_name}"
            # Remove the file from the bucket
            self.supabase.storage.from_(BUCKET_NAME).remove([bucket_path])
            # Delete the document from the database
            self.supabase.table("documents").delete().eq("id", document_id).execute()
            return SuccessResponse(message="Document deleted successfully").model_dump(), 200
        except Exception as e:
            raise DatabaseException("Error deleting document", data={"error": str(e)})
        