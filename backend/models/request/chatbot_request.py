from pydantic import BaseModel
from fastapi import UploadFile

class UploadDocumentRequest(BaseModel):
    chatbot_id: str
    file: UploadFile

class DeleteDocumentRequest(BaseModel):
    chatbot_id: str
    document_id: str