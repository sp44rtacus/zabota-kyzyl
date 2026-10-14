from datetime import datetime, timedelta
from typing import Any, List
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User
from app.models.district import District
from app.models.category import Category
from app.models.application import Application
from app.models.task_assignment import TaskAssignment
from app.schemas.analytics import AnalyticsDashboardResponse
from app.services.excel_service import ExcelService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/analytics", tags=["Аналитика и отчетность для руководства"])


@router.get("/dashboard", response_model=AnalyticsDashboardResponse, summary="Сводная аналитическая панель директора")
def get_analytics_dashboard(
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Полная сводная аналитика:
    - Общие счетчики (выполнено, в работе, SOS)
    - Статистика по микрорайонам Кызыла с географическими координатами
    - Распределение по категориям льгот (включая ветеранов, многодетных и СВО)
    - Динамика обращений по дням
    """
    total_apps = db.query(Application).count()
    completed_apps = db.query(Application).filter(Application.status == "completed").count()
    in_progress_apps = db.query(Application).filter(Application.status.in_(["approved", "in_progress", "review"])).count()
    emergency_apps = db.query(Application).filter(Application.is_emergency == True).count()

    total_volunteers = db.query(User).filter(User.role == "volunteer").count()
    active_volunteers = db.query(User).filter(User.role == "volunteer", User.status == "active").count()
    total_hours = db.query(func.sum(User.volunteer_hours)).scalar() or 0

    districts = db.query(District).all()
    dist_stats = []
    dist_summary_for_excel = []
    for d in districts:
        d_total = db.query(Application).filter(Application.district_id == d.id).count()
        d_comp = db.query(Application).filter(Application.district_id == d.id, Application.status == "completed").count()
        d_sos = db.query(Application).filter(Application.district_id == d.id, Application.is_emergency == True).count()
        dist_stats.append({
            "district_id": d.id,
            "district_name": d.name,
            "total_applications": d_total,
            "completed_applications": d_comp,
            "emergency_count": d_sos,
            "lat": d.lat or 51.7197,
            "lng": d.lng or 94.4378
        })
        dist_summary_for_excel.append({
            "name": d.name,
            "total": d_total,
            "completed": d_comp,
            "emergency": d_sos
        })

    # Категории услуг
    categories = db.query(Category).all()
    cat_stats = []
    for c in categories:
        c_count = db.query(Application).filter(Application.category_id == c.id).count()
        pct = round((c_count / total_apps * 100), 1) if total_apps > 0 else 0.0
        cat_stats.append({
            "category_id": c.id,
            "category_title": c.title,
            "count": c_count,
            "percentage": pct
        })

    # Льготные категории
    benefit_groups = db.query(
        Application.benefit_category,
        func.count(Application.id)
    ).group_by(Application.benefit_category).all()

    benefit_stats = [
        {"category": bg[0], "count": bg[1]}
        for bg in benefit_groups
    ]

    # Динамика за последние 7 дней
    dynamics = []
    now = datetime.now()
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%d.%m")
        # Для реалистичного отображения
        day_total = db.query(Application).filter(
            func.date(Application.created_at) == day_date.date()
        ).count()
        day_comp = db.query(Application).filter(
            func.date(Application.created_at) == day_date.date(),
            Application.status == "completed"
        ).count()
        day_sos = db.query(Application).filter(
            func.date(Application.created_at) == day_date.date(),
            Application.is_emergency == True
        ).count()

        dynamics.append({
            "date": day_str,
            "total": day_total,
            "completed": day_comp,
            "emergency": day_sos
        })

    return {
        "summary": {
            "total_applications": total_apps,
            "completed_applications": completed_apps,
            "in_progress_applications": in_progress_apps,
            "emergency_applications": emergency_apps,
            "total_volunteers": total_volunteers,
            "active_volunteers": active_volunteers,
            "total_volunteer_hours": int(total_hours),
            "districts_covered": len(districts)
        },
        "district_stats": dist_stats,
        "category_stats": cat_stats,
        "benefit_stats": benefit_stats,
        "dynamics": dynamics
    }


@router.get("/heatmap-points", summary="Точки для тепловой карты спроса на помощь")
def get_heatmap_points(
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Any:
    """Координаты всех заявок с весами для тепловой карты Кызыла (Leaflet Heatmap)."""
    apps = db.query(Application).all()
    points = []
    for a in apps:
        if a.lat and a.lng:
            # Вес точки: если SOS - максимальный вес 1.0, иначе 0.6
            weight = 1.0 if a.is_emergency else (0.8 if a.status != "completed" else 0.4)
            points.append({
                "lat": a.lat,
                "lng": a.lng,
                "weight": weight,
                "uin": a.uin,
                "is_emergency": a.is_emergency,
                "district": a.district.name if a.district else "",
                "address": a.address,
                "category": a.category.title if a.category else ""
            })
    return points


@router.get("/export-excel", summary="Выгрузка сводного реестра в Excel (.xlsx)")
def export_excel_report(
    current_user: User = Depends(require_roles(["inspector", "director"])),
    db: Session = Depends(get_db)
) -> Response:
    """Генерация и скачивание официального отчета в формате Microsoft Excel."""
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    districts = db.query(District).all()

    dist_summary = []
    for d in districts:
        d_total = db.query(Application).filter(Application.district_id == d.id).count()
        d_comp = db.query(Application).filter(Application.district_id == d.id, Application.status == "completed").count()
        d_sos = db.query(Application).filter(Application.district_id == d.id, Application.is_emergency == True).count()
        dist_summary.append({
            "name": d.name,
            "total": d_total,
            "completed": d_comp,
            "emergency": d_sos
        })

    excel_bytes = ExcelService.generate_applications_report(apps, dist_summary)

    filename = f"Otchet_Zabota_Kyzyl_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
