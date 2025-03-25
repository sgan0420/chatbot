from pydantic import BaseModel

class CreateSessionResponse(BaseModel):
    session_id: str

class ChatResponse(BaseModel):
    answer: str