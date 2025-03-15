from abc import ABC, abstractmethod


class ChatbotService(ABC):
    @abstractmethod
    def get_user_chatbots(self, user_id: str) -> tuple:
        pass
