from typing import List, Optional

from pydantic import BaseModel


class Chatbot(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    vector_faiss_url: Optional[str]
    vector_pkl_url: Optional[str]
    created_at: str
    updated_at: str


class ChatbotListResponse(BaseModel):
    chatbots: List[Chatbot]
