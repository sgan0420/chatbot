from typing import List
from pydantic import BaseModel


class ProcessDocumentsResponse(BaseModel):
    processed_count: int
    failed_urls: List[str]


class ChatResponse(BaseModel):
    answer: str