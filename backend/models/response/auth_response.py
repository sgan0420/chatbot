from pydantic import BaseModel
from gotrue.types import User, Session


class SignupResponse(BaseModel):
    user: User
    session: Session


class LoginResponse(BaseModel):
    user: User
    session: Session
