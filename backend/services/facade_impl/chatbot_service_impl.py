import uuid
from backend.models.request.chatbot_request import UploadDocumentRequest, DeleteDocumentRequest
from config import get_supabase_client
from exceptions.database_exception import DatabaseException
from models.response.chatbot_response import ChatbotListResponse, DocumentListResponse
from models.response.response_wrapper import SuccessResponse, ErrorResponse
from services.facade.chatbot_service import ChatbotService

BUCKET_NAME = "DOCUMENTS"

class ChatbotServiceImpl(ChatbotService):
    def __init__(self, user_id=None, user_token=None):
        self.user_id = user_id
        self.supabase = get_supabase_client(user_token)

    def get_user_chatbots(self, user_id: str) -> tuple:
        try:
            response = (
                self.supabase.table("chatbots")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            chatbot_list_response = ChatbotListResponse(chatbots=response.data)

        except Exception as e:
            raise DatabaseException("Error fetching chatbots", data={"error": str(e)})

        return SuccessResponse(data=chatbot_list_response).model_dump(), 200

    def upload_document(self, data: UploadDocumentRequest) -> tuple:
        """Upload a document to Supabase bucket"""
        try:
            document_id = str(uuid.uuid4())
            chatbot_id = data.chatbot_id
            file = data.file
            file_name = file.filename
            file_type = file_name.split(".")[-1]            
            bucket_path = f"{self.user_id}/{chatbot_id}/document/{file_name}"
            
            # Upload the file to storage bucket
            self.supabase.storage.from_(BUCKET_NAME).upload(bucket_path, file)
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
    
    def delete_document(self, data: DeleteDocumentRequest) -> tuple:
        try:
            document_id = data.document_id
            chatbot_id = data.chatbot_id
            file_name = self.supabase.table("documents").select("file_name").eq("id", document_id).single().execute().data["file_name"]
            bucket_path = f"{self.user_id}/{chatbot_id}/document/{file_name}"
            # Remove the file from the bucket
            self.supabase.storage.from_(BUCKET_NAME).remove([bucket_path])
            # Delete the document from the database
            self.supabase.table("documents").delete().eq("id", document_id).execute()
            return SuccessResponse(message="Document deleted successfully").model_dump(), 200
        except Exception as e:
            raise DatabaseException("Error deleting document", data={"error": str(e)})
        