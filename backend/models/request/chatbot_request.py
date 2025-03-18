from pydantic import BaseModel
from fastapi import UploadFile

class UploadDocumentRequest(BaseModel):
    chatbot_id: str
    file: UploadFile