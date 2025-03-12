from pydantic import BaseModel
from typing import TypeVar, Generic, Optional, Any

T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel, Generic[T]):
    success: bool = False
    data: Optional[T] = None
    message: str
