from pydantic import BaseModel


class ProcessDocumentsRequest(BaseModel):
    chatbot_id: str

class ChatRequest(BaseModel):
    query: str 