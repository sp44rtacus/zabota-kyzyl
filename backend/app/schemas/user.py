from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DistrictResponse(BaseModel):
    id: int
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=6, max_length=20)
    district_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)
    role: str = Field(default="volunteer")


class UserResponse(UserBase):
    id: int
    role: str
    status: str
    rating: float
    volunteer_hours: int
    created_at: datetime
    district: Optional[DistrictResponse] = None

    class Config:
        from_attributes = True


class CertificateResponse(BaseModel):
    id: int
    title: str
    description: str
    certificate_code: str
    issued_at: datetime

    class Config:
        from_attributes = True
