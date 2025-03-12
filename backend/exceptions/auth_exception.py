from exceptions.base_api_exception import BaseAPIException


class AuthException(BaseAPIException):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, status_code)
