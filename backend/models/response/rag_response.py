from typing import List, Optional
from pydantic import BaseModel


class ProcessDocumentsResponse(BaseModel):
    processed_count: int
    failed_urls: List[str]


class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None 