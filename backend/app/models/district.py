from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class District(Base):
    """
    Микрорайоны города Кызыла (Центр, ЛДО, ПДО, Каа-Хем, Вавилинский затон, МЖК, Южный и др.)
    """
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    lat = Column(Float, nullable=True)  # Координаты центра района для карты Кызыла
    lng = Column(Float, nullable=True)

    # Связи
    users = relationship("User", back_populates="district")
    applications = relationship("Application", back_populates="district")
    warming_points = relationship("WarmingPoint", back_populates="district")
