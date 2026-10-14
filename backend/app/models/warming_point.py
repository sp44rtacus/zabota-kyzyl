from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class WarmingPoint(Base):
    """
    Публичные пункты обогрева, раздачи гуманитарной помощи и временного размещения Мэрии г. Кызыла
    Отображаются на интерактивной карте для жителей
    """
    __tablename__ = "warming_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(255), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    description = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    operating_hours = Column(String(100), default="Круглосуточно / 08:00 - 20:00")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, default=50)

    # Связи
    district = relationship("District", back_populates="warming_points")
