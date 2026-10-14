import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api import auth, public, volunteers, admin, analytics
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Жизненный цикл приложения:
    - Автоматическое создание таблиц в базе данных
    - Первоначальное наполнение реалистичными данными Кызыла (если БД пуста)
    - Создание каталогов для загрузки файлов
    """
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    settings.PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

    # Создание таблиц
    Base.metadata.create_all(bind=engine)

    # Наполнение тестовыми данными
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## АИС «Забота» — Мэрия города Кызыла
    Единый муниципальный портал социализации, адресной помощи и координации волонтерства
    Департамента по социальной политике мэрии города Кызыла.
    
    ### Роли пользователей:
    * **Гость (Житель)**: подача обращений, SOS-заявки с микрофона, трекер по UIN, карта пунктов обогрева.
    * **Волонтер**: лента задач, взятие в работу, чат с инспектором, загрузка фото До/После, вывод PDF-справки о практике.
    * **Инспектор соцзащиты**: Канбан-доска, сплит-экран проверки фотоотчетов, назначение задач в 1 клик, модерация.
    * **Руководитель (Директор)**: аналитика, тепловая карта спроса по районам Кызыла, выгрузка в Excel.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Настройка CORS для связи с React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздача статических файлов (аудиозаписи и фотографии До/После)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Подключение маршрутизаторов API
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(volunteers.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

# Раздача собранного SPA фронтенда (Unified Single-Service Hosting)
def find_frontend_dist() -> Path:
    env_dist = os.getenv("FRONTEND_DIST")
    if env_dist and Path(env_dist).exists():
        return Path(env_dist)
    
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "frontend" / "dist",
        Path.cwd() / "frontend" / "dist",
        Path("/app/frontend/dist"),
    ]
    for candidate in candidates:
        if (candidate / "index.html").exists():
            return candidate
    return candidates[0]

frontend_dist = find_frontend_dist()

if (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith(("api", "docs", "redoc", "openapi.json", "uploads")):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", tags=["Служебные"])
    def root_status():
        """Проверка доступности сервиса."""
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "municipality": settings.MUNICIPALITY_NAME
        }
