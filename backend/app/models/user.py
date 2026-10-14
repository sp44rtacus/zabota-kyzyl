from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    """
    Пользователи системы АИС «Забота»
    Роли: volunteer (волонтер), inspector (инспектор соцзащиты), director (руководитель департамента)
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="volunteer")  # volunteer, inspector, director
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # pending, active, blocked
    rating = Column(Float, nullable=False, default=5.0)
    volunteer_hours = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Связи
    district = relationship("District", back_populates="users")
    assignments = relationship("TaskAssignment", back_populates="volunteer")
    certificates = relationship("Certificate", back_populates="user")
    messages = relationship("TaskMessage", back_populates="sender")
