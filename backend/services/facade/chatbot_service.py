from abc import ABC, abstractmethod


class ChatbotService(ABC):
    # 1. Manage Chatbots
    @abstractmethod
    def get_user_chatbots(self, user_id: str) -> tuple:
        pass

    @abstractmethod
    def create_chatbot(self, user_id: str, data: dict) -> tuple:
        pass

    @abstractmethod
    def get_chatbot_details(self, user_id: str, chatbot_id: str) -> tuple:
        pass

    @abstractmethod
    def update_chatbot(self, user_id: str, chatbot_id: str, data: dict) -> tuple:
        pass

    @abstractmethod
    def delete_chatbot(self, user_id: str, chatbot_id: str) -> tuple:
        pass

    # 2. Manage Documents
    @abstractmethod
    def upload_document(
        self, user_id: str, chatbot_id: str, document_data: dict
    ) -> tuple:
        pass

    @abstractmethod
    def list_documents(self, user_id: str, chatbot_id: str) -> tuple:
        pass

    @abstractmethod
    def delete_document(self, user_id: str, chatbot_id: str, document_id: str) -> tuple:
        pass
