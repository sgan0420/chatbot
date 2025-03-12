from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Annotated, Optional


PasswordStr = Annotated[str, StringConstraints(min_length=6)]


class SignupRequest(BaseModel):
    email: EmailStr
    password: PasswordStr
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: PasswordStr
