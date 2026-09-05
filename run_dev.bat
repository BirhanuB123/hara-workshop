@echo off
title HARA WORKSHOP Launcher
echo ============================================================
echo   HARA WORKSHOP - Metal and Wood Solution
echo   Starting Full-Stack Local Development Servers...
echo ============================================================
echo.

start "HARA Workshop - Django Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

timeout /t 2 /nobreak >nul

start "HARA Workshop - Vite Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================================
echo   SERVERS LAUNCHED IN NEW WINDOWS!
echo.
echo   Frontend URL:  http://localhost:5173
echo   Backend API:   http://127.0.0.1:8000/api/
echo   Django Admin:  http://127.0.0.1:8000/admin/
echo ============================================================
echo.
pause
