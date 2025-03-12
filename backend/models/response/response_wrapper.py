from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel, Generic[T]):
    success: bool = False
    data: Optional[T] = None
    message: str
