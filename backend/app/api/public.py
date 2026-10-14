import random
import uuid
from datetime import datetime
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import aiofiles

from app.core.config import settings
from app.core.database import get_db
from app.models.district import District
from app.models.category import Category
from app.models.application import Application
from app.models.warming_point import WarmingPoint
from app.models.user import User
from app.schemas.user import DistrictResponse
from app.schemas.application import (
    CategoryResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationTrackResponse
)

router = APIRouter(prefix="/public", tags=["Публичная зона (Портал жителей)"])


def generate_uin(db: Session) -> str:
    """Генерация уникального регистрационного номера заявки: KZ-2026-XXXX"""
    year = datetime.now().strftime("%Y")
    for _ in range(20):
        rand_num = random.randint(1000, 9999)
        uin = f"KZ-{year}-{rand_num}"
        existing = db.query(Application).filter(Application.uin == uin).first()
        if not existing:
            return uin
    return f"KZ-{year}-{uuid.uuid4().hex[:6].upper()}"


@router.get("/districts", response_model=List[DistrictResponse], summary="Список микрорайонов Кызыла")
def get_districts(db: Session = Depends(get_db)) -> Any:
    """Получение всех микрорайонов города с географическими координатами."""
    return db.query(District).order_by(District.name).all()


@router.get("/categories", response_model=List[CategoryResponse], summary="Категории социальных услуг")
def get_categories(db: Session = Depends(get_db)) -> Any:
    """Получение всех доступных категорий адресной помощи."""
    return db.query(Category).order_by(Category.id).all()


@router.get("/warming-points", summary="Пункты обогрева и помощи Мэрии Кызыла")
def get_warming_points(db: Session = Depends(get_db)) -> Any:
    """Список официальных пунктов обогрева для отображения на публичной карте."""
    points = db.query(WarmingPoint).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "address": p.address,
            "district_name": p.district.name if p.district else "",
            "description": p.description,
            "phone": p.phone,
            "operating_hours": p.operating_hours,
            "lat": p.lat,
            "lng": p.lng,
            "capacity": p.capacity
        }
        for p in points
    ]


@router.get("/summary-counters", summary="Публичные счетчики эффективности")
def get_public_counters(db: Session = Depends(get_db)) -> Any:
    """Статистические счетчики для главной страницы портала."""
    total_completed = db.query(Application).filter(Application.status == "completed").count()
    total_volunteers = db.query(User).filter(User.role == "volunteer", User.status == "active").count()
    total_districts = db.query(District).count()
    total_applications = db.query(Application).count()

    return {
        "completed_count": total_completed,
        "volunteers_count": total_volunteers,
        "districts_count": total_districts,
        "total_applications": total_applications
    }


@router.post("/applications", response_model=ApplicationResponse, summary="Подача заявки от жителя (JSON)")
def create_application_json(app_in: ApplicationCreate, db: Session = Depends(get_db)) -> Any:
    """Создание заявки на адресную помощь через стандартную веб-форму."""
    district = db.query(District).filter(District.id == app_in.district_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="Указанный микрорайон не найден")

    category = db.query(Category).filter(Category.id == app_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Указанная категория помощи не найдена")

    uin = generate_uin(db)
    
    # Координаты: берем переданные или центроид района
    lat = app_in.lat or district.lat
    lng = app_in.lng or district.lng

    new_app = Application(
        uin=uin,
        applicant_name=app_in.applicant_name.strip(),
        phone=app_in.phone.strip(),
        is_third_party=app_in.is_third_party,
        third_party_info=app_in.third_party_info.strip() if app_in.third_party_info else None,
        benefit_category=app_in.benefit_category.strip(),
        district_id=app_in.district_id,
        address=app_in.address.strip(),
        category_id=app_in.category_id,
        description=app_in.description.strip(),
        is_emergency=app_in.is_emergency,
        status="new",
        required_volunteers=app_in.required_volunteers,
        lat=lat,
        lng=lng
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@router.post("/applications/with-audio", response_model=ApplicationResponse, summary="Подача заявки с аудиозаписью")
async def create_application_with_audio(
    applicant_name: str = Form(...),
    phone: str = Form(...),
    benefit_category: str = Form(...),
    district_id: int = Form(...),
    address: str = Form(...),
    category_id: int = Form(...),
    description: str = Form(...),
    is_emergency: bool = Form(False),
    is_third_party: bool = Form(False),
    third_party_info: Optional[str] = Form(None),
    required_volunteers: int = Form(1),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
) -> Any:
    """Создание заявки с возможностью прикрепления голосового сообщения."""
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="Указанный микрорайон не найден")

    uin = generate_uin(db)
    audio_url = None

    if audio_file:
        settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        file_ext = audio_file.filename.split(".")[-1] if "." in audio_file.filename else "webm"
        file_name = f"voice_{uin}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = settings.AUDIO_DIR / file_name

        async with aiofiles.open(file_path, "wb") as f:
            content = await audio_file.read()
            await f.write(content)

        audio_url = f"/uploads/audio/{file_name}"

    app = Application(
        uin=uin,
        applicant_name=applicant_name.strip(),
        phone=phone.strip(),
        is_third_party=is_third_party,
        third_party_info=third_party_info.strip() if third_party_info else None,
        benefit_category=benefit_category.strip(),
        district_id=district_id,
        address=address.strip(),
        category_id=category_id,
        description=description.strip(),
        audio_url=audio_url,
        is_emergency=is_emergency,
        status="new",
        required_volunteers=required_volunteers,
        lat=lat or district.lat,
        lng=lng or district.lng
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/track/{uin}", response_model=ApplicationTrackResponse, summary="Трекинг статуса по UIN номеру")
def track_application_by_uin(uin: str, db: Session = Depends(get_db)) -> Any:
    """
    Отслеживание статуса заявки жителем по регистрационному номеру.
    Персональные данные (номер квартиры, телефон) скрываются в целях безопасности.
    """
    clean_uin = uin.strip().upper()
    app = db.query(Application).filter(Application.uin == clean_uin).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Заявка с номером {clean_uin} не найдена в едином реестре"
        )

    # Анонимизация адреса: оставляем только улицу
    addr_parts = app.address.split(",")
    anonymized_address = addr_parts[0].strip() if addr_parts else "Адрес в г. Кызыл"

    # Формирование этапов жизненного цикла
    status_order = ["new", "approved", "in_progress", "review", "completed"]
    current_idx = status_order.index(app.status) if app.status in status_order else -1

    history = [
        {"status": "new", "label": "Принята системой", "completed": current_idx >= 0, "date": app.created_at.strftime("%d.%m.%Y %H:%M")},
        {"status": "approved", "label": "Одобрена инспектором", "completed": current_idx >= 1, "date": "В течение 24 ч."},
        {"status": "in_progress", "label": "Назначен волонтер", "completed": current_idx >= 2, "date": "Исполняется"},
        {"status": "review", "label": "Проверка фотоотчета", "completed": current_idx >= 3, "date": "Контроль качества"},
        {"status": "completed", "label": "Помощь оказана", "completed": current_idx >= 4, "date": "Завершено"}
    ]

    return {
        "uin": app.uin,
        "benefit_category": app.benefit_category,
        "district_name": app.district.name if app.district else "",
        "category_title": app.category.title if app.category else "",
        "status": app.status,
        "is_emergency": app.is_emergency,
        "created_at": app.created_at,
        "status_history": history,
        "anonymized_address": anonymized_address
    }
