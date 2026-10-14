Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " АИС «Забота» — Мэрия города Кызыла                      " -ForegroundColor Yellow
Write-Host " Запуск бэкенда (FastAPI) и фронтенда (React + Vite)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")

# Запуск Backend
Write-Host "1. Запуск Backend (FastAPI: http://localhost:8000/docs)..." -ForegroundColor Green
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; `$env:PYTHONPATH='$baseDir\backend'; py -3.12 -m uvicorn app.main:app --reload --port 8000" -PassThru

Start-Sleep -Seconds 2

# Запуск Frontend
Write-Host "2. Запуск Frontend (React: http://localhost:5173)..." -ForegroundColor Green
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; npm.cmd run dev -- --host" -PassThru

Start-Sleep -Seconds 3

# Открытие браузера
Start-Process "http://localhost:5173"

Write-Host "Приложение успешно запущено!" -ForegroundColor Cyan
Write-Host "Веб-интерфейс: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Swagger API:   http://localhost:8000/docs" -ForegroundColor Yellow
