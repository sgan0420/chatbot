from pydantic import BaseModel
from typing import List

class CreateSessionResponse(BaseModel):
    session_id: str

class ChatSessionListResponse(BaseModel):
    sessions: List[dict]

class ChatResponse(BaseModel):
    answer: str