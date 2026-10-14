from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str
    phone: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str = Field(..., description="Номер телефона пользователя")
    password: str = Field(..., min_length=4, description="Пароль пользователя")


class QuickLoginRequest(BaseModel):
    role: str = Field(..., description="Роль для быстрого переключения в демо: volunteer, inspector, director")
