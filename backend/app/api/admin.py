import uuid
from datetime import datetime, timezone
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.application import Application
from app.models.task_assignment import TaskAssignment
from app.models.task_message import TaskMessage
from app.models.certificate import Certificate
from app.schemas.task import TaskAssignmentVerify

router = APIRouter(prefix="/admin", tags=["Панель инспектора и администратора"])


@router.get("/kanban", summary="Канбан-доска заявок (4-5 колонок)")
def get_kanban_board(
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Получение всех заявок, распределенных по колонкам рабочего стола инспектора:
    - new (Новые, требующие модерации, с красной подсветкой SOS)
    - approved (Поиск волонтера)
    - in_progress (В процессе выполнения)
    - review (Ожидают проверки фотоотчетов)
    - completed (Успешно закрытые)
    """
    all_apps = db.query(Application).order_by(
        Application.is_emergency.desc(),
        Application.created_at.desc()
    ).all()

    columns = {
        "new": [],
        "approved": [],
        "in_progress": [],
        "review": [],
        "completed": []
    }

    for app in all_apps:
        # Получаем данные назначенных волонтеров
        volunteers = []
        for a in app.assignments:
            if a.volunteer:
                volunteers.append({
                    "assignment_id": a.id,
                    "volunteer_id": a.volunteer.id,
                    "full_name": a.volunteer.full_name,
                    "phone": a.volunteer.phone,
                    "status": a.status,
                    "photo_before_url": a.photo_before_url,
                    "photo_after_url": a.photo_after_url
                })

        item = {
            "id": app.id,
            "uin": app.uin,
            "applicant_name": app.applicant_name,
            "phone": app.phone,
            "benefit_category": app.benefit_category,
            "district_id": app.district_id,
            "district_name": app.district.name if app.district else "",
            "address": app.address,
            "category_id": app.category_id,
            "category_title": app.category.title if app.category else "",
            "description": app.description,
            "audio_url": app.audio_url,
            "is_emergency": app.is_emergency,
            "status": app.status,
            "required_volunteers": app.required_volunteers,
            "created_at": app.created_at,
            "volunteers": volunteers
        }

        col_key = app.status if app.status in columns else "new"
        columns[col_key].append(item)

    return columns


@router.post("/applications/{application_id}/status", summary="Изменение статуса заявки инспектором")
def update_application_status(
    application_id: int,
    status_update: dict = Body(...),
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Одобрение, отклонение или перевод заявки на следующий этап."""
    new_status = status_update.get("status")
    allowed_statuses = ["new", "approved", "in_progress", "review", "completed", "rejected"]
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Недопустимый статус. Разрешены: {allowed_statuses}")

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    app.status = new_status
    db.commit()
    return {"message": f"Статус заявки {app.uin} изменен на '{new_status}'", "status": new_status}


@router.post("/applications/{application_id}/assign-volunteer", summary="Назначение волонтера в 1 клик")
def assign_volunteer_one_click(
    application_id: int,
    payload: dict = Body(...),
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Прямое назначение конкретного волонтера инспектором."""
    volunteer_id = payload.get("volunteer_id")
    if not volunteer_id:
        raise HTTPException(status_code=400, detail="Не указан ID волонтера")

    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    volunteer = db.query(User).filter(User.id == volunteer_id, User.role == "volunteer").first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    # Проверка, нет ли уже такого назначения
    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.application_id == application_id,
        TaskAssignment.volunteer_id == volunteer_id
    ).first()

    if not assignment:
        assignment = TaskAssignment(
            application_id=application_id,
            volunteer_id=volunteer_id,
            status="accepted",
            hours_awarded=2
        )
        db.add(assignment)

    app.status = "in_progress"

    # Сообщение в чат
    msg = TaskMessage(
        application_id=application_id,
        sender_id=current_user.id,
        message=f"Инспектор {current_user.full_name} назначил(а) на заявку волонтера {volunteer.full_name}."
    )
    db.add(msg)

    db.commit()
    return {"message": f"Волонтер {volunteer.full_name} успешно назначен на задачу {app.uin}"}


@router.get("/verification/{assignment_id}", summary="Детали для сплит-экрана проверки фотоотчета")
def get_verification_details(
    assignment_id: int,
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Данные для сплит-экрана Side-by-Side (Фото ДО vs Фото ПОСЛЕ + аудио + контакты)."""
    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Назначение не найдено")

    app = a.application
    vol = a.volunteer

    return {
        "assignment_id": a.id,
        "status": a.status,
        "photo_before_url": a.photo_before_url,
        "photo_after_url": a.photo_after_url,
        "volunteer_comment": a.volunteer_comment,
        "inspector_comment": a.inspector_comment,
        "hours_awarded": a.hours_awarded,
        "assigned_at": a.assigned_at,
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
            "is_emergency": app.is_emergency
        },
        "volunteer": {
            "id": vol.id,
            "full_name": vol.full_name,
            "phone": vol.phone,
            "rating": vol.rating,
            "current_hours": vol.volunteer_hours
        }
    }


@router.post("/verification/{assignment_id}/verify", summary="Утверждение или отклонение фотоотчета")
def verify_task_report(
    assignment_id: int,
    verify_in: TaskAssignmentVerify,
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Утверждение отчета (начисление часов практики) или отправка на доработку."""
    a = db.query(TaskAssignment).filter(TaskAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Назначение не найдено")

    app = a.application
    vol = a.volunteer

    if verify_in.action == "approve":
        a.status = "verified"
        a.hours_awarded = verify_in.hours
        a.completed_at = datetime.now(timezone.utc)
        a.inspector_comment = verify_in.inspector_comment or "Отчет проверен и утвержден инспекцией соцзащиты."
        app.status = "completed"

        # Автоматическое начисление часов и повышение рейтинга
        vol.volunteer_hours += verify_in.hours
        vol.rating = min(5.0, round(vol.rating + 0.1, 1))

        # Сообщение в чат
        msg = TaskMessage(
            application_id=app.id,
            sender_id=current_user.id,
            message=f"Поздравляем! Отчет утвержден инспектором. Вам зачислено +{verify_in.hours} ч. социальной практики."
        )
        db.add(msg)

    elif verify_in.action == "reject":
        a.status = "rejected"
        a.inspector_comment = verify_in.inspector_comment or "Отчет отправлен на доработку. Предоставьте четкие фото."
        app.status = "in_progress"

        msg = TaskMessage(
            application_id=app.id,
            sender_id=current_user.id,
            message=f"Внимание: отчет возвращен на доработку. Замечание инспектора: {a.inspector_comment}"
        )
        db.add(msg)
    else:
        raise HTTPException(status_code=400, detail="Действие должно быть 'approve' или 'reject'")

    db.commit()
    return {"message": "Результат верификации успешно сохранен", "new_status": a.status}


@router.get("/volunteers", summary="Реестр волонтеров города")
def get_all_volunteers(
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Список всех волонтеров для модерации и назначения на задачи."""
    volunteers = db.query(User).filter(User.role == "volunteer").order_by(User.volunteer_hours.desc()).all()
    return [
        {
            "id": v.id,
            "full_name": v.full_name,
            "phone": v.phone,
            "district_name": v.district.name if v.district else "Не указан",
            "status": v.status,
            "rating": v.rating,
            "volunteer_hours": v.volunteer_hours,
            "created_at": v.created_at,
            "active_tasks_count": db.query(TaskAssignment).filter(
                TaskAssignment.volunteer_id == v.id,
                TaskAssignment.status.in_(["accepted", "submitted"])
            ).count()
        }
        for v in volunteers
    ]


@router.post("/volunteers/{volunteer_id}/toggle-status", summary="Блокировка / Активация волонтера")
def toggle_volunteer_status(
    volunteer_id: int,
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Смена статуса волонтера (активен / заблокирован)."""
    v = db.query(User).filter(User.id == volunteer_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    v.status = "blocked" if v.status == "active" else "active"
    db.commit()
    return {"message": f"Статус волонтера {v.full_name} изменен на '{v.status}'", "status": v.status}


@router.post("/volunteers/{volunteer_id}/issue-certificate", summary="Выдача почетной грамоты волонтеру")
def issue_certificate_to_volunteer(
    volunteer_id: int,
    payload: dict = Body(...),
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Выдача официальной почетной грамоты мэрии за наработанные часы."""
    v = db.query(User).filter(User.id == volunteer_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    title = payload.get("title", "За бескорыстный вклад в развитие волонтерского движения г. Кызыла")
    description = payload.get("description", f"Награждается волонтер {v.full_name} за добросовестное выполнение социальной помощи и наработку свыше {v.volunteer_hours} часов практики.")
    code = f"GR-KYZ-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"

    cert = Certificate(
        user_id=v.id,
        title=title,
        description=description,
        certificate_code=code
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {"message": "Почетная грамота успешно зарегистрирована", "certificate_code": code, "cert_id": cert.id}
