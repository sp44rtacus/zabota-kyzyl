from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Certificate(Base):
    """
    Грамоты, благодарственные письма и справки волонтеров
    """
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    certificate_code = Column(String(50), unique=True, nullable=False)  # Например: GR-KYZ-2026-081
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Связи
    user = relationship("User", back_populates="certificates")
