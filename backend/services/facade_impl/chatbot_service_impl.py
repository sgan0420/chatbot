from config import get_supabase_client
from exceptions.database_exception import DatabaseException
from models.response.chatbot_response import ChatbotListResponse
from models.response.response_wrapper import SuccessResponse
from services.facade.chatbot_service import ChatbotService


class ChatbotServiceImpl(ChatbotService):
    def __init__(self, user_token=None):
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
