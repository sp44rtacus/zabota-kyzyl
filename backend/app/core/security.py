from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_password_hash(password: str) -> str:
    """Генерация безопасного хеша пароля с использованием bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия открытого пароля и сохраненного хеша."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Генерация JWT-токена авторизации."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Декодирование и верификация JWT токена."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Получение текущего пользователя, если передан заголовок Authorization,
    иначе возвращает None (для публичных маршрутов с опциональной авторизацией).
    """
    if not token:
        return None
    
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
        
    from app.models.user import User  # отложенный импорт во избежание циклической зависимости
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Обязательная аутентификация пользователя."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    from app.models.user import User
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if user.status == "blocked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Учетная запись заблокирована администрацией"
        )
    return user


def require_roles(allowed_roles: List[str]):
    """Фабрика зависимостей для проверки ролей (RBAC)."""
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется одна из ролей: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
