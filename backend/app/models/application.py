from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Application(Base):
    """
    Заявки на адресную, бытовую и экстренную помощь
    Статусы:
      - new: новая, поступила от гражданина
      - approved: одобрена инспектором, открыта в ленте волонтеров
      - in_progress: взята волонтером в работу
      - review: волонтер прикрепил фотоотчет ДО/ПОСЛЕ, ожидает проверки
      - completed: отчет утвержден инспектором, часы начислены
      - rejected: отклонена (нецелевое обращение или спам)
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    uin = Column(String(20), unique=True, index=True, nullable=False)  # например KZ-2026-1042
    applicant_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    is_third_party = Column(Boolean, default=False, nullable=False)
    third_party_info = Column(Text, nullable=True)  # ФИО и телефон того, кто подал за соседа
    benefit_category = Column(String(100), nullable=False)  # Ветеран труда, Инвалид, Семья участника СВО и др.
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    address = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(Text, nullable=False)
    audio_url = Column(String(255), nullable=True)  # путь к голосовому сообщению
    is_emergency = Column(Boolean, default=False, nullable=False)  # Флаг SOS (экстренная заявка)
    status = Column(String(20), default="new", index=True, nullable=False)
    required_volunteers = Column(Integer, default=1, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Связи
    district = relationship("District", back_populates="applications")
    category = relationship("Category", back_populates="applications")
    assignments = relationship("TaskAssignment", back_populates="application", cascade="all, delete-orphan")
    messages = relationship("TaskMessage", back_populates="application", cascade="all, delete-orphan")
