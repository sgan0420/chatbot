from pydantic import BaseModel
from typing import Optional

class CreateSessionRequest(BaseModel):
    chatbot_id: str

class ChatRequest(BaseModel):
    chatbot_id: str
    session_id: str
    query: str 

class GetChatHistoryRequest(BaseModel):
    chatbot_id: str
    session_id: str
    
class PublicChatRequest(BaseModel):
    chatbot_id: str
    session_id: Optional[str]
    query: str
