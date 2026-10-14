import uuid
from datetime import datetime, timezone
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session
import aiofiles

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.application import Application
from app.models.task_assignment import TaskAssignment
from app.models.task_message import TaskMessage
from app.models.certificate import Certificate
from app.schemas.application import ApplicationResponse
from app.schemas.task import (
    TaskAssignmentResponse,
    TaskMessageResponse,
    TaskMessageCreate
)
from app.schemas.user import CertificateResponse
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/volunteer", tags=["Личный кабинет волонтера"])


@router.get("/feed", summary="Лента доступных задач для волонтеров")
def get_volunteer_feed(
    district_id: Optional[int] = None,
    along_my_routes: bool = False,
    emergency_only: bool = False,
    current_user: User = Depends(require_roles(["volunteer", "inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Лента заявок, одобренных инспекцией и ожидающих отклика волонтеров.
    Поддерживает умную фильтрацию «По пути» (по району проживания волонтера).
    """
    query = db.query(Application).filter(Application.status == "approved")

    if emergency_only:
        query = query.filter(Application.is_emergency == True)

    if along_my_routes and current_user.district_id:
        query = query.filter(Application.district_id == current_user.district_id)
    elif district_id:
        query = query.filter(Application.district_id == district_id)

    applications = query.order_by(Application.is_emergency.desc(), Application.created_at.desc()).all()

    result = []
    for app in applications:
        # Для безопасности в общей ленте скрываем точный номер квартиры до момента взятия
        addr_parts = app.address.split(",")
        public_addr = addr_parts[0].strip() if addr_parts else app.address

        result.append({
            "id": app.id,
            "uin": app.uin,
            "benefit_category": app.benefit_category,
            "district_id": app.district_id,
            "district_name": app.district.name if app.district else "",
            "address": public_addr,
            "category_id": app.category_id,
            "category_title": app.category.title if app.category else "",
            "category_icon": app.category.icon if app.category else "HeartHandshake",
            "description": app.description,
            "is_emergency": app.is_emergency,
            "status": app.status,
            "required_volunteers": app.required_volunteers,
            "assigned_count": len(app.assignments),
            "lat": app.lat,
            "lng": app.lng,
            "created_at": app.created_at
        })
    return result


@router.post("/tasks/{application_id}/accept", summary="Откликнуться / Взять заявку в работу")
def accept_task(
    application_id: int,
    current_user: User = Depends(require_roles(["volunteer"])),
    db: Session = Depends(get_db)
) -> Any:
    """Волонтер берет одобренную задачу в работу."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if app.status not in ["approved", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail=f"Невозможно взять задачу со статусом '{app.status}'. Доступны только одобренные задачи."
        )

    # Проверка, не откликался ли уже этот волонтер
    existing = db.query(TaskAssignment).filter(
        TaskAssignment.application_id == application_id,
        TaskAssignment.volunteer_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Вы уже откликнулись на эту задачу")

    # Проверка лимита волонтеров
    current_assigned = db.query(TaskAssignment).filter(TaskAssignment.application_id == application_id).count()
    if current_assigned >= app.required_volunteers:
        raise HTTPException(status_code=400, detail="На эту задачу уже набрано требуемое количество волонтеров")

    assignment = TaskAssignment(
        application_id=application_id,
        volunteer_id=current_user.id,
        status="accepted",
        hours_awarded=2
    )
    db.add(assignment)
    app.status = "in_progress"

    # Автоматическое системное сообщение в чат
    msg = TaskMessage(
        application_id=application_id,
        sender_id=current_user.id,
        message=f"Здравствуйте! Я волонтер {current_user.full_name}, взял(а) задачу в работу. Свяжусь с заявителем."
    )
    db.add(msg)

    db.commit()
    db.refresh(assignment)
    return {"message": "Заявка успешно принята в работу", "assignment_id": assignment.id}


@router.get("/my-tasks", summary="Мои текущие и выполненные задачи волонтера")
def get_my_tasks(
    current_user: User = Depends(require_roles(["volunteer"])),
    db: Session = Depends(get_db)
) -> Any:
    """Список всех задач, закрепленных за текущим волонтером, с полными контактными данными."""
    assignments = db.query(TaskAssignment).filter(
        TaskAssignment.volunteer_id == current_user.id
    ).order_by(TaskAssignment.assigned_at.desc()).all()

    result = []
    for a in assignments:
        app = a.application
        result.append({
            "assignment_id": a.id,
            "status": a.status,
            "hours_awarded": a.hours_awarded,
            "photo_before_url": a.photo_before_url,
            "photo_after_url": a.photo_after_url,
            "volunteer_comment": a.volunteer_comment,
            "inspector_comment": a.inspector_comment,
            "assigned_at": a.assigned_at,
            "completed_at": a.completed_at,
            "application": {
                "id": app.id,
                "uin": app.uin,
                "applicant_name": app.applicant_name,
                "phone": app.phone,
                "benefit_category": app.benefit_category,
                "district_name": app.district.name if app.district else "",
                "address": app.address,
                "category_title": app.category.title if app.category else "",
                "description": app.description,
                "audio_url": app.audio_url,
                "is_emergency": app.is_emergency,
                "status": app.status
            }
        })
    return result


@router.post("/tasks/{assignment_id}/submit", summary="Сдача фотоотчета ДО/ПОСЛЕ волонтером")
async def submit_task_report(
    assignment_id: int,
    volunteer_comment: str = Form(...),
    photo_before: Optional[UploadFile] = File(None),
    photo_after: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(["volunteer"])),
    db: Session = Depends(get_db)
) -> Any:
    """Загрузка фотографий 'До' и 'После' и отправка отчета на проверку инспектору."""
    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.id == assignment_id,
        TaskAssignment.volunteer_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Назначение задачи не найдено")

    settings.PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

    if photo_before:
        ext_before = photo_before.filename.split(".")[-1] if "." in photo_before.filename else "jpg"
        fn_before = f"before_{assignment.id}_{uuid.uuid4().hex[:6]}.{ext_before}"
        fp_before = settings.PHOTOS_DIR / fn_before
        async with aiofiles.open(fp_before, "wb") as f:
            await f.write(await photo_before.read())
        assignment.photo_before_url = f"/uploads/photos/{fn_before}"

    if photo_after:
        ext_after = photo_after.filename.split(".")[-1] if "." in photo_after.filename else "jpg"
        fn_after = f"after_{assignment.id}_{uuid.uuid4().hex[:6]}.{ext_after}"
        fp_after = settings.PHOTOS_DIR / fn_after
        async with aiofiles.open(fp_after, "wb") as f:
            await f.write(await photo_after.read())
        assignment.photo_after_url = f"/uploads/photos/{fn_after}"

    assignment.volunteer_comment = volunteer_comment.strip()
    assignment.status = "submitted"
    assignment.application.status = "review"

    # Добавляем уведомление в чат
    msg = TaskMessage(
        application_id=assignment.application_id,
        sender_id=current_user.id,
        message=f"Фотоотчет загружен и передан инспекции на проверку. Комментарий: {volunteer_comment}"
    )
    db.add(msg)

    db.commit()
    return {"message": "Фотоотчет успешно отправлен на модерацию", "status": "submitted"}


@router.get("/chat/{application_id}", response_model=List[TaskMessageResponse], summary="История сообщений по задаче")
def get_task_chat(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Получение сообщений чата между волонтером и инспектором."""
    messages = db.query(TaskMessage).filter(
        TaskMessage.application_id == application_id
    ).order_by(TaskMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "application_id": m.application_id,
            "sender_id": m.sender_id,
            "message": m.message,
            "created_at": m.created_at,
            "sender_name": m.sender.full_name if m.sender else "Пользователь",
            "sender_role": m.sender.role if m.sender else "user"
        }
        for m in messages
    ]


@router.post("/chat/{application_id}", summary="Отправить сообщение в чат по задаче")
def send_task_message(
    application_id: int,
    msg_in: TaskMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Отправка сообщения в чат координации заявки."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    msg = TaskMessage(
        application_id=application_id,
        sender_id=current_user.id,
        message=msg_in.message.strip()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": msg.id,
        "message": msg.message,
        "created_at": msg.created_at,
        "sender_name": current_user.full_name,
        "sender_role": current_user.role
    }


@router.get("/profile/practice-pdf", summary="Скачать официальную Справку о практике (PDF)")
def download_practice_pdf(
    current_user: User = Depends(require_roles(["volunteer", "inspector", "director"])),
    db: Session = Depends(get_db)
) -> Response:
    """Генерация и скачивание официальной Справки о практике волонтера для колледжа."""
    completed_assignments = db.query(TaskAssignment).filter(
        TaskAssignment.volunteer_id == current_user.id,
        TaskAssignment.status == "verified"
    ).all()

    tasks_list = [
        {
            "uin": a.application.uin,
            "category": a.application.category.title if a.application.category else "",
            "address": a.application.address,
            "date": a.completed_at.strftime("%d.%m.%Y") if a.completed_at else a.assigned_at.strftime("%d.%m.%Y"),
            "hours": a.hours_awarded
        }
        for a in completed_assignments
    ]

    pdf_bytes = PDFService.generate_practice_certificate(
        volunteer_name=current_user.full_name,
        phone=current_user.phone,
        district_name=current_user.district.name if current_user.district else "г. Кызыл",
        total_hours=current_user.volunteer_hours,
        tasks_completed=len(completed_assignments),
        tasks_list=tasks_list
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Spravka_Praktika_{current_user.id}.pdf"'}
    )


@router.get("/certificates", response_model=List[CertificateResponse], summary="Список грамот волонтера")
def get_volunteer_certificates(
    current_user: User = Depends(require_roles(["volunteer"])),
    db: Session = Depends(get_db)
) -> Any:
    """Получение списка наград и грамот текущего волонтера."""
    return db.query(Certificate).filter(Certificate.user_id == current_user.id).order_by(Certificate.issued_at.desc()).all()


@router.get("/certificates/{cert_id}/pdf", summary="Скачать Грамоту волонтера в PDF")
def download_certificate_pdf(
    cert_id: int,
    db: Session = Depends(get_db)
) -> Response:
    """Скачивание бланка почетной грамоты в формате PDF."""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Грамота не найдена")

    pdf_bytes = PDFService.generate_volunteer_certificate(
        volunteer_name=cert.user.full_name,
        certificate_title=cert.title,
        description=cert.description,
        certificate_code=cert.certificate_code
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Gramota_{cert.certificate_code}.pdf"'}
    )
