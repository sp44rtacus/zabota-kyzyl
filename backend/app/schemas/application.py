from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import DistrictResponse


class CategoryResponse(BaseModel):
    id: int
    title: str
    icon: str

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    applicant_name: str = Field(..., min_length=2, max_length=255, description="ФИО заявителя")
    phone: str = Field(..., min_length=6, max_length=20, description="Телефон для связи")
    is_third_party: bool = Field(default=False, description="Подано за соседа/родственника")
    third_party_info: Optional[str] = Field(default=None, description="Данные того, кто подал")
    benefit_category: str = Field(..., description="Категория льготы (Ветеран, Инвалид, СВО и др.)")
    district_id: int = Field(..., description="ID микрорайона Кызыла")
    address: str = Field(..., min_length=5, description="Улица, дом, квартира")
    category_id: int = Field(..., description="ID категории помощи")
    description: str = Field(..., min_length=5, description="Подробное описание ситуации")
    is_emergency: bool = Field(default=False, description="Флаг экстренной SOS помощи")
    required_volunteers: int = Field(default=1, ge=1, le=10)
    lat: Optional[float] = None
    lng: Optional[float] = None


class ApplicationResponse(BaseModel):
    id: int
    uin: str
    applicant_name: str
    phone: str
    is_third_party: bool
    third_party_info: Optional[str] = None
    benefit_category: str
    district_id: int
    address: str
    category_id: int
    description: str
    audio_url: Optional[str] = None
    is_emergency: bool
    status: str
    required_volunteers: int
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: datetime
    district: Optional[DistrictResponse] = None
    category: Optional[CategoryResponse] = None
    assigned_count: int = 0

    class Config:
        from_attributes = True


class ApplicationTrackResponse(BaseModel):
    uin: str
    benefit_category: str
    district_name: str
    category_title: str
    status: str
    is_emergency: bool
    created_at: datetime
    status_history: List[dict]
    anonymized_address: str  # Только улица без номера квартиры в целях безопасности
