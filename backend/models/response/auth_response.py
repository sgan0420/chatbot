from gotrue.types import Session, User
from pydantic import BaseModel


class SignupResponse(BaseModel):
    user: User
    session: Session


class LoginResponse(BaseModel):
    user: User
    session: Session
