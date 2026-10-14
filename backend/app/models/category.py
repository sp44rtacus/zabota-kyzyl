from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    """
    Категории помощи и социальных услуг (Уборка снега, Доставка продуктов, Мелкий ремонт, Подвоз дров/угля и т.д.)
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=False, default="HeartHandshake")

    applications = relationship("Application", back_populates="category")
