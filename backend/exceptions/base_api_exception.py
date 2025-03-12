from typing import Optional


class BaseAPIException(Exception):
    def __init__(
        self, message: str, status_code: int = 400, data: Optional[dict] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.data = data

    def to_dict(self):
        return {
            "success": False,
            "status_code": self.status_code,
            "message": self.message,
            "data": self.data,
        }
