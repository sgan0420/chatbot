from exceptions.base_api_exception import BaseAPIException
from typing import Optional


class AuthException(BaseAPIException):
    def __init__(
        self, message: str, status_code: int = 400, data: Optional[dict] = None
    ):
        super().__init__(message, status_code, data)
