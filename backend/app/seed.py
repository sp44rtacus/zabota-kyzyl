import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.district import District
from app.models.category import Category
from app.models.user import User
from app.models.application import Application
from app.models.task_assignment import TaskAssignment
from app.models.task_message import TaskMessage
from app.models.certificate import Certificate
from app.models.warming_point import WarmingPoint


def seed_database(db: Session) -> None:
    """Первоначальное наполнение базы данных реальными данными города Кызыла."""
    # Проверка, не была ли БД уже заполнена
    if db.query(District).first():
        return

    print("Запуск наполнения базы данных АИС «Забота» (г. Кызыл)...")

    # 1. Микрорайоны города Кызыла с географическими координатами
    districts_data = [
        {"name": "Центральный район", "lat": 51.7197, "lng": 94.4378},
        {"name": "ЛДО (Левобережные дачи)", "lat": 51.7450, "lng": 94.3600},
        {"name": "ПДО (Правобережные дачи)", "lat": 51.7550, "lng": 94.4800},
        {"name": "пгт. Каа-Хем", "lat": 51.6900, "lng": 94.5500},
        {"name": "Вавилинский затон", "lat": 51.7800, "lng": 94.3300},
        {"name": "МЖК", "lat": 51.7050, "lng": 94.4600},
        {"name": "Южный микрорайон", "lat": 51.6950, "lng": 94.4100},
        {"name": "Восточный микрорайон", "lat": 51.7200, "lng": 94.4900},
        {"name": "Горный", "lat": 51.7350, "lng": 94.4650},
        {"name": "Ближний Каа-Хем", "lat": 51.7000, "lng": 94.5100},
    ]
    districts = {}
    for d in districts_data:
        obj = District(name=d["name"], lat=d["lat"], lng=d["lng"])
        db.add(obj)
        db.flush()
        districts[d["name"]] = obj

    # 2. Категории помощи
    categories_data = [
        {"title": "Уборка снега и расчистка подъездов", "icon": "Snowflake"},
        {"title": "Доставка продуктов питания и лекарств", "icon": "ShoppingBag"},
        {"title": "Подвоз угля и колка дров (отопление)", "icon": "Flame"},
        {"title": "Мелкий бытовой ремонт и электрика", "icon": "Wrench"},
        {"title": "Сопровождение маломобильных в поликлинику", "icon": "HeartPulse"},
        {"title": "Экстренная помощь при авариях ЖКХ (SOS)", "icon": "AlertTriangle"},
    ]
    categories = {}
    for c in categories_data:
        obj = Category(title=c["title"], icon=c["icon"])
        db.add(obj)
        db.flush()
        categories[c["title"]] = obj

    # 3. Пункты обогрева и помощи Мэрии Кызыла
    warming_points_data = [
        {
            "name": "Центральный пункт обогрева и гуманитарной помощи Мэрии",
            "address": "г. Кызыл, ул. Кочетова, д. 29",
            "district": districts["Центральный район"],
            "description": "Круглосуточный пункт: горячий чай, обогрев, консультация социального работника.",
            "phone": "+7 (39422) 2-12-34",
            "operating_hours": "Круглосуточно",
            "lat": 51.7197,
            "lng": 94.4378,
            "capacity": 80
        },
        {
            "name": "Социальный пункт помощи «Сайзырал»",
            "address": "г. Кызыл, ул. Колхозная, д. 45",
            "district": districts["Южный микрорайон"],
            "description": "Раздача продуктовых наборов, теплая одежда для детей и пожилых граждан.",
            "phone": "+7 (39422) 5-11-22",
            "operating_hours": "08:00 - 20:00 ежедневно",
            "lat": 51.6950,
            "lng": 94.4100,
            "capacity": 50
        },
        {
            "name": "Мобильный пункт обогрева МЧС и Мэрии (Вавилинский затон)",
            "address": "г. Кызыл, Вавилинский затон, 6-я линия",
            "district": districts["Вавилинский затон"],
            "description": "Пункт с дизель-генератором и тепловыми пушками на случай перебоев в электросетях.",
            "phone": "112 (ЕДДС Кызыла)",
            "operating_hours": "Круглосуточно в зимний период",
            "lat": 51.7800,
            "lng": 94.3300,
            "capacity": 40
        },
        {
            "name": "Пункт помощи ЛДО (Левобережное дачное общество)",
            "address": "г. Кызыл, 4-я остановка ЛДО, павильон Мэрии",
            "district": districts["ЛДО (Левобережные дачи)"],
            "description": "Обогрев жителей, прием экстренных заявок на подвоз угля.",
            "phone": "+7 (39422) 3-80-90",
            "operating_hours": "09:00 - 19:00",
            "lat": 51.7450,
            "lng": 94.3600,
            "capacity": 35
        }
    ]
    for wp in warming_points_data:
        obj = WarmingPoint(
            name=wp["name"],
            address=wp["address"],
            district_id=wp["district"].id,
            description=wp["description"],
            phone=wp["phone"],
            operating_hours=wp["operating_hours"],
            lat=wp["lat"],
            lng=wp["lng"],
            capacity=wp["capacity"]
        )
        db.add(obj)

    # 4. Пользователи системы (Аккаунты для защиты)
    hashed_pwd = get_password_hash("password123")

    # Руководитель Департамента
    director = User(
        full_name="Монгуш Буян Мергенович",
        phone="+7 (999) 001-00-01",
        password_hash=hashed_pwd,
        role="director",
        status="active",
        rating=5.0,
        volunteer_hours=0,
        district_id=districts["Центральный район"].id
    )
    db.add(director)

    # Инспектор соцзащиты
    inspector = User(
        full_name="Куулар Аида Сергеевна",
        phone="+7 (999) 002-00-02",
        password_hash=hashed_pwd,
        role="inspector",
        status="active",
        rating=5.0,
        volunteer_hours=0,
        district_id=districts["Центральный район"].id
    )
    db.add(inspector)

    # Волонтер №1 (Лидер, много наработанных часов)
    vol1 = User(
        full_name="Ондар Чингис Артурович",
        phone="+7 (999) 003-00-03",
        password_hash=hashed_pwd,
        role="volunteer",
        status="active",
        rating=4.9,
        volunteer_hours=48,
        district_id=districts["Центральный район"].id
    )
    db.add(vol1)

    # Волонтер №2
    vol2 = User(
        full_name="Сарыглар Айдын Эресович",
        phone="+7 (999) 004-00-04",
        password_hash=hashed_pwd,
        role="volunteer",
        status="active",
        rating=4.8,
        volunteer_hours=32,
        district_id=districts["Вавилинский затон"].id
    )
    db.add(vol2)

    # Волонтер №3
    vol3 = User(
        full_name="Ховалыг Долаана Викторовна",
        phone="+7 (999) 005-00-05",
        password_hash=hashed_pwd,
        role="volunteer",
        status="active",
        rating=5.0,
        volunteer_hours=26,
        district_id=districts["Южный микрорайон"].id
    )
    db.add(vol3)
    db.flush()

    # 5. Грамота для волонтера №1 (чтобы сразу продемонстрировать скачивание PDF)
    cert1 = Certificate(
        user_id=vol1.id,
        title="За выдающийся вклад в развитие адресной социальной помощи в городе Кызыле",
        description="За бескорыстное участие в зимней акции взаимопомощи, расчистку снега и доставку угля одиноким пенсионерам Кызыла.",
        certificate_code="GR-KYZ-2026-0042",
        issued_at=datetime.now(timezone.utc) - timedelta(days=10)
    )
    db.add(cert1)

    # 6. Реалистичные заявки граждан г. Кызыла
    apps_data = [
        # SOS Экстренная новая заявка
        {
            "uin": "KZ-2026-1042",
            "applicant_name": "Хертек Зоя Дажыевна",
            "phone": "+7 (913) 345-67-89",
            "benefit_category": "Одинокий пенсионер (84 года)",
            "district": districts["Вавилинский затон"],
            "address": "ул. 7-я Линия, дом 18",
            "category": categories["Экстренная помощь при авариях ЖКХ (SOS)"],
            "description": "Срочно требуется помощь! В доме заглох генератор, печное отопление остыло, дрова под снегом не могу достать, тяжело передвигаться с ходунками.",
            "is_emergency": True,
            "status": "new",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=2),
            "lat": 51.7820,
            "lng": 94.3340
        },
        # Одобренная задача в ленте волонтеров
        {
            "uin": "KZ-2026-1039",
            "applicant_name": "Монгуш Чечек Борисовна",
            "phone": "+7 (923) 543-21-00",
            "benefit_category": "Семья участника СВО",
            "district": districts["Центральный район"],
            "address": "ул. Ленина, д. 44, кв. 12",
            "category": categories["Уборка снега и расчистка подъездов"],
            "description": "Необходимо расчистить снег во дворе частного сектора и у ворот гаража. Муж находится в зоне СВО, дома двое маленьких детей.",
            "is_emergency": False,
            "status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=5),
            "lat": 51.7210,
            "lng": 94.4390
        },
        # Одобренная SOS
        {
            "uin": "KZ-2026-1038",
            "applicant_name": "Ооржак Борис Кара-оолович",
            "phone": "+7 (983) 123-45-67",
            "benefit_category": "Инвалид I группы",
            "district": districts["ЛДО (Левобережные дачи)"],
            "address": "ЛДО, 3-я остановка, ул. Береговая, д. 9",
            "category": categories["Подвоз угля и колка дров (отопление)"],
            "description": "Закончились колотые дрова для растопки печи, уголь на улице смерзся. Не могу расколоть сам из-за травмы позвоночника.",
            "is_emergency": True,
            "status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=6),
            "lat": 51.7470,
            "lng": 94.3620
        },
        # В процессе выполнения (волонтер Чингис)
        {
            "uin": "KZ-2026-1035",
            "applicant_name": "Кужугет Светлана Ивановна",
            "phone": "+7 (913) 890-11-22",
            "benefit_category": "Ветеран труда РФ",
            "district": districts["Южный микрорайон"],
            "address": "ул. Бай-Хаакская, д. 6, кв. 34",
            "category": categories["Доставка продуктов питания и лекарств"],
            "description": "Доставка жизненно необходимых лекарств по рецепту из аптеки №1 (ул. Дружбы) и базовых продуктов (хлеб, молоко, крупы).",
            "is_emergency": False,
            "status": "in_progress",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "lat": 51.6960,
            "lng": 94.4120,
            "assigned_volunteer": vol1
        },
        # На проверке отчета инспектором (Review - сплит-экран фото)
        {
            "uin": "KZ-2026-1031",
            "applicant_name": "Донгак Михаил Серенович",
            "phone": "+7 (923) 987-65-43",
            "benefit_category": "Ветеран боевых действий",
            "district": districts["пгт. Каа-Хем"],
            "address": "пгт. Каа-Хем, ул. Таежная, д. 15",
            "category": categories["Уборка снега и расчистка подъездов"],
            "description": "После сильного бурана занесло входную группу дома и тропинку к угольнику. Нужна расчистка лопатами.",
            "is_emergency": False,
            "status": "review",
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "lat": 51.6920,
            "lng": 94.5530,
            "assigned_volunteer": vol2,
            "with_photos": True
        },
        # Успешно выполненная заявка
        {
            "uin": "KZ-2026-1020",
            "applicant_name": "Салчак Рада Викторовна",
            "phone": "+7 (913) 444-55-66",
            "benefit_category": "Многодетная семья",
            "district": districts["МЖК"],
            "address": "ул. Дружбы, д. 28, кв. 7",
            "category": categories["Мелкий бытовой ремонт и электрика"],
            "description": "Замена вышедшего из строя выключателя и ремонт дверной ручки в комнате детей.",
            "is_emergency": False,
            "status": "completed",
            "created_at": datetime.now(timezone.utc) - timedelta(days=4),
            "lat": 51.7060,
            "lng": 94.4620,
            "assigned_volunteer": vol1,
            "completed": True
        }
    ]

    for item in apps_data:
        app_obj = Application(
            uin=item["uin"],
            applicant_name=item["applicant_name"],
            phone=item["phone"],
            benefit_category=item["benefit_category"],
            district_id=item["district"].id,
            address=item["address"],
            category_id=item["category"].id,
            description=item["description"],
            is_emergency=item["is_emergency"],
            status=item["status"],
            required_volunteers=1,
            lat=item.get("lat"),
            lng=item.get("lng"),
            created_at=item["created_at"]
        )
        db.add(app_obj)
        db.flush()

        # Добавление назначения волонтера, если предусмотрено
        vol = item.get("assigned_volunteer")
        if vol:
            assignment_status = "submitted" if item.get("with_photos") else ("verified" if item.get("completed") else "accepted")
            
            # Фото-заглушки для демонстрации сплит-экрана "До/После"
            photo_before = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80" if (item.get("with_photos") or item.get("completed")) else None
            photo_after = "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80" if (item.get("with_photos") or item.get("completed")) else None

            assign_obj = TaskAssignment(
                application_id=app_obj.id,
                volunteer_id=vol.id,
                status=assignment_status,
                photo_before_url=photo_before,
                photo_after_url=photo_after,
                volunteer_comment="Снег полностью расчищен, обеспечен свободный проход к угольнику и калитке." if item.get("with_photos") else None,
                inspector_comment="Отличная работа, спасибо за оперативность!" if item.get("completed") else None,
                hours_awarded=3 if item.get("completed") else 2,
                assigned_at=item["created_at"] + timedelta(hours=1),
                completed_at=item["created_at"] + timedelta(hours=5) if item.get("completed") else None
            )
            db.add(assign_obj)

            # Сообщения в чат заявки
            db.add(TaskMessage(
                application_id=app_obj.id,
                sender_id=vol.id,
                message="Здравствуйте! Взял задачу, выезжаю по указанному адресу в Кызыле."
            ))
            if item.get("with_photos"):
                db.add(TaskMessage(
                    application_id=app_obj.id,
                    sender_id=vol.id,
                    message="Работу выполнил! Фотографии До и После прикрепил в отчете."
                ))
            if item.get("completed"):
                db.add(TaskMessage(
                    application_id=app_obj.id,
                    sender_id=inspector.id,
                    message="Отчет проверен и утвержден инспекцией. Часы практики начислены в ваш профиль!"
                ))

    db.commit()
    print("База данных успешно наполнена реалистичными данными г. Кызыла!")
