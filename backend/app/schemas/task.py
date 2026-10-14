from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse
from app.schemas.application import ApplicationResponse


class TaskAssignmentResponse(BaseModel):
    id: int
    application_id: int
    volunteer_id: int
    status: str
    photo_before_url: Optional[str] = None
    photo_after_url: Optional[str] = None
    volunteer_comment: Optional[str] = None
    inspector_comment: Optional[str] = None
    hours_awarded: int
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    volunteer: Optional[UserResponse] = None
    application: Optional[ApplicationResponse] = None

    class Config:
        from_attributes = True


class TaskAssignmentSubmit(BaseModel):
    volunteer_comment: str = Field(..., min_length=3, description="Комментарий волонтера о проделанной работе")


class TaskAssignmentVerify(BaseModel):
    action: str = Field(..., description="'approve' или 'reject'")
    hours: int = Field(default=2, ge=1, le=24, description="Количество начисляемых часов практики")
    inspector_comment: Optional[str] = Field(default=None, description="Замечание или похвала инспектора")


class TaskMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class TaskMessageResponse(BaseModel):
    id: int
    application_id: int
    sender_id: int
    message: str
    created_at: datetime
    sender_name: str
    sender_role: str

    class Config:
        from_attributes = True
