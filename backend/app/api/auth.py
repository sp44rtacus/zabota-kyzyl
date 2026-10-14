from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from app.models.user import User
from app.models.district import District
from app.schemas.auth import Token, LoginRequest, QuickLoginRequest
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Аутентификация и пользователи"])


@router.post("/login", response_model=Token, summary="Авторизация по телефону и паролю")
def login(login_data: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """Вход в систему для волонтеров, инспекторов и руководства."""
    user = db.query(User).filter(User.phone == login_data.phone.strip()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный номер телефона или пароль"
        )
    if user.status == "blocked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваша учетная запись заблокирована администратором"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "phone": user.phone},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone
    }


@router.post("/quick-login", response_model=Token, summary="Быстрый вход для демонстрации комиссии (1 клик)")
def quick_login(request: QuickLoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Эндпоинт для мгновенного переключения ролей во время защиты проекта.
    Позволяет комиссии сразу увидеть систему глазами любой роли.
    """
    target_role = request.role.lower().strip()
    user = db.query(User).filter(User.role == target_role, User.status == "active").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Демонстрационный пользователь с ролью '{target_role}' не найден. Выполните сидирование БД."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "phone": user.phone}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone
    }


@router.post("/register", response_model=UserResponse, summary="Регистрация нового волонтера")
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Самостоятельная регистрация волонтера на портале."""
    existing = db.query(User).filter(User.phone == user_in.phone.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким номером телефона уже зарегистрирован"
        )

    if user_in.district_id:
        dist = db.query(District).filter(District.id == user_in.district_id).first()
        if not dist:
            raise HTTPException(status_code=400, detail="Указанный микрорайон не найден")

    new_user = User(
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip(),
        password_hash=get_password_hash(user_in.password),
        role="volunteer",
        district_id=user_in.district_id,
        status="active",
        rating=5.0,
        volunteer_hours=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserResponse, summary="Текущий профиль пользователя")
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    """Получение профиля текущего авторизованного пользователя."""
    return current_user
