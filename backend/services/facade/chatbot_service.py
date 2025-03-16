from abc import ABC, abstractmethod


class ChatbotService(ABC):
    # 1. Manage Chatbots
    @abstractmethod
    def get_user_chatbots(self, user_id: str) -> tuple:
        pass

    @abstractmethod
    def create_chatbot(self, user_id: str, data: dict) -> tuple:
        data["user_id"] = user_id
        response = self.supabase.from_("chatbots").select("*").eq("user_id", user_id).execute()
        
        if response.data:
            return True
        return False

    @abstractmethod
    def get_chatbot_details(self, user_id: str, chatbot_id: str) -> tuple:
        response = self.supabase.from_("chatbots").select("*").eq("user_id", user_id).eq("id", chatbot_id).execute()
        
        if response.data:
            return True
        return False

    @abstractmethod
    def update_chatbot(self, user_id: str, chatbot_id: str, data: dict) -> tuple:
        response = self.supabase.from_("chatbots").update(data).eq("user_id", user_id).eq("id", chatbot_id).execute()

        if response.data:
            return True
        return False

    @abstractmethod
    def delete_chatbot(self, user_id: str, chatbot_id: str) -> tuple:
        response = self.supabase.from_("chatbots").update(data).eq("user_id", user_id).eq("id", chatbot_id).execute()
        
        if response.data:
            return True
        return False

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
