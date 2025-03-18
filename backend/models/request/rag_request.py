from pydantic import BaseModel


class RAGServiceRequest(BaseModel):
    chatbot_id: str
    chat_id: str

class ChatRequest(BaseModel):
    query: str 