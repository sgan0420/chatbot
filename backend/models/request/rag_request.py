from typing import List
from pydantic import BaseModel, HttpUrl


class ProcessDocumentsRequest(BaseModel):
    urls: List[HttpUrl]


class ChatRequest(BaseModel):
    query: str 