from abc import ABC, abstractmethod
from models.request.chat_request import ChatRequest, CreateSessionRequest, GetChatHistoryRequest

class ChatService(ABC):
    @abstractmethod
    def create_session(self, user_token: str, data: CreateSessionRequest) -> tuple[dict, int]:
        """Create a new chat session"""
        pass

    @abstractmethod
    def chat(self, user_id: str, user_token: str, data: ChatRequest) -> tuple[dict, int]:
        """Process a chat query and return response"""
        pass 

    @abstractmethod
    def get_chat_history(self, user_token: str, data: GetChatHistoryRequest) -> tuple[dict, int]:
        """Get chat history for a specific chat session"""
        pass