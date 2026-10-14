# ==============================================================================
# Multi-stage Dockerfile для АИС «Забота» (Мэрия г. Кызыла)
# Сборка React Frontend + FastAPI Backend в единый легковесный контейнер
# ==============================================================================

# Этап 1: Сборка клиентской части (React 19 + TypeScript + Vite + TailwindCSS)
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Этап 2: Финальный продакшн образ на базе Python 3.12
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend
ENV PORT=8000

# Установка системных шрифтов DejaVu для генерации PDF-сертификатов на кириллице (ReportLab)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Установка зависимостей бэкенда
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода бэкенда
COPY backend/ ./backend/

# Копирование собранного фронтенда из первого этапа
COPY --from=frontend-builder /build/dist ./frontend/dist

# Порт для входящих HTTP-подключений
EXPOSE 8000

# Запуск приложения через Uvicorn с авто-подхватом порта от хостинг-провайдера ($PORT)
CMD uvicorn app.main:app --app-dir /app/backend --host 0.0.0.0 --port ${PORT:-8000}
