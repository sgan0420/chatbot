from pydantic import BaseModel

class ProcessDocumentsRequest(BaseModel):
    chatbot_id: str
