from typing import Annotated, Optional

from pydantic import BaseModel, EmailStr, StringConstraints

PasswordStr = Annotated[str, StringConstraints(min_length=6)]


class SignupRequest(BaseModel):
    email: EmailStr
    password: PasswordStr
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: PasswordStr

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    access_token: str
