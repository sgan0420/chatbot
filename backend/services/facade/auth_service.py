from abc import ABC, abstractmethod


class AuthService(ABC):
    @abstractmethod
    def signup(self, email: str, password: str) -> dict:
        pass

    @abstractmethod
    def login(self, email: str, password: str) -> dict:
        pass
