from abc import ABC, abstractmethod
from models.request.rag_request import ChatRequest


class RAGService(ABC):
    @abstractmethod
    def process_documents_from_urls(self) -> tuple[dict, int]:
        """Process documents from URLs and create/update vector store"""
        pass

    @abstractmethod
    def chat(self, data: ChatRequest) -> tuple[dict, int]:
        """Process a chat query and return response"""
        pass 