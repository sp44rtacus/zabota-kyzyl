from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Конфигурация приложения АИС «Забота»
    Содержит настройки безопасности, пути к файлам и параметры подключения к БД.
    """
    PROJECT_NAME: str = "АИС «Забота» — Мэрия г. Кызыла"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Безопасность и JWT
    SECRET_KEY: str = "kyzyl-zabota-social-security-secret-key-2026-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 дней
    
    # База данных: SQLite для локальной разработки и защиты, поддержка PostgreSQL
    DATABASE_URL: str = "sqlite:///./zabota_kyzyl.db"
    
    # Директории для загрузки файлов (фотоотчеты и голосовые обращения)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    AUDIO_DIR: Path = UPLOAD_DIR / "audio"
    PHOTOS_DIR: Path = UPLOAD_DIR / "photos"
    
    # Контакты и реквизиты Департамента (для бланков и шапки)
    MUNICIPALITY_NAME: str = "Департамент по социальной политике мэрии города Кызыла"
    ADDRESS: str = "г. Кызыл, ул. Кочетова, д. 29"
    PHONE_HOTLINE: str = "+7 (39422) 2-12-34"
    EMERGENCY_HOTLINE: str = "112 / 050 (ЕДДС Кызыла)"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
