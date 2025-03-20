from abc import ABC, abstractmethod
from models.request.rag_request import ChatRequest, ProcessDocumentsRequest, GetChatHistoryRequest


class RAGService(ABC):
    @abstractmethod
    def process_documents_from_urls(self, user_id: str, user_token: str, data: ProcessDocumentsRequest) -> tuple[dict, int]:
        """Process documents from URLs and create/update vector store"""
        pass

    @abstractmethod
    def chat(self, user_id: str, user_token: str, data: ChatRequest) -> tuple[dict, int]:
        """Process a chat query and return response"""
        pass 

    @abstractmethod
    def get_chat_history(self, user_id: str, user_token: str, data: GetChatHistoryRequest) -> tuple[dict, int]:
        """Get chat history for a specific chat session"""
        pass