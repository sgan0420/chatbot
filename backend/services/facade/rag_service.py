from abc import ABC, abstractmethod
from models.request.rag_request import ProcessDocumentsRequest


class RAGService(ABC):
    @abstractmethod
    def process_documents_from_urls(self, user_id: str, user_token: str, data: ProcessDocumentsRequest) -> tuple[dict, int]:
        """Process documents from URLs and create/update vector store"""
        pass