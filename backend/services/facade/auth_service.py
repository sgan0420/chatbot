from abc import ABC, abstractmethod

from models.request.auth_request import LoginRequest, SignupRequest


class AuthService(ABC):
    @abstractmethod
    def signup(self, data: SignupRequest) -> tuple:
        pass

    @abstractmethod
    def login(self, data: LoginRequest) -> tuple:
        pass
