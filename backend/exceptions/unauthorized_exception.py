from typing import Optional

from exceptions.base_api_exception import BaseAPIException


class UnauthorizedException(BaseAPIException):
    def __init__(
        self, message: str, status_code: int = 401, data: Optional[dict] = None
    ):
        super().__init__(message, status_code, data)
