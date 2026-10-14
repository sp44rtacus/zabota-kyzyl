from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class TaskMessage(Base):
    """
    Чат по заявке между волонтером и инспектором соцзащиты
    """
    __tablename__ = "task_messages"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Связи
    application = relationship("Application", back_populates="messages")
    sender = relationship("User", back_populates="messages")
