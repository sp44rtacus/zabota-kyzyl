from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class TaskAssignment(Base):
    """
    Назначение волонтера на конкретную заявку
    Статусы:
      - accepted: волонтер откликнулся, задача в работе
      - submitted: волонтер загрузил фото ДО/ПОСЛЕ и отправил отчет
      - verified: инспектор проверил и утвердил (начислены часы)
      - rejected: инспектор вернул на доработку с замечанием
    """
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="accepted", nullable=False)
    photo_before_url = Column(String(255), nullable=True)  # Фото "До"
    photo_after_url = Column(String(255), nullable=True)   # Фото "После"
    volunteer_comment = Column(Text, nullable=True)
    inspector_comment = Column(Text, nullable=True)        # Замечание инспектора при проверке
    hours_awarded = Column(Integer, default=2, nullable=False)  # Зачтенные часы
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Связи
    application = relationship("Application", back_populates="assignments")
    volunteer = relationship("User", back_populates="assignments")
