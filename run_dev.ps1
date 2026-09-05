# HARA WORKSHOP - Dual Server Launcher
Write-Host "============================================================" -ForegroundColor Red
Write-Host "  HARA WORKSHOP - Metal and Wood Solution" -ForegroundColor White
Write-Host "  Starting Full-Stack Local Development Servers..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Red

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nServers launched in background windows!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:   http://127.0.0.1:8000/api/" -ForegroundColor Cyan
Write-Host "Admin:     http://127.0.0.1:8000/admin/" -ForegroundColor Cyan
