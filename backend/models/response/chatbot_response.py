from typing import List
from pydantic import BaseModel


class Chatbot(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    created_at: str
    updated_at: str

class CreateChatbotResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    created_at: str
    updated_at: str

class Document(BaseModel):
    id: str
    chatbot_id: str
    file_name: str
    file_type: str
    bucket_path: str
    is_processed: bool
    created_at: str

class ChatbotListResponse(BaseModel):
    chatbots: List[dict]

class DocumentListResponse(BaseModel):
    documents: List[dict]
