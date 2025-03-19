from pydantic import BaseModel


class ProcessDocumentsRequest(BaseModel):
    chatbot_id: str

class ChatRequest(BaseModel):
    chatbot_id: str
    session_id: str
    query: str 