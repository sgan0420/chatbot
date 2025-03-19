from pydantic import BaseModel
from werkzeug.datastructures import FileStorage

class UploadDocumentRequest(BaseModel):
    chatbot_id: str
    file: FileStorage

    class Config:
        arbitrary_types_allowed = True

class DeleteDocumentRequest(BaseModel):
    chatbot_id: str
    document_id: str