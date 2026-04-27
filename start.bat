@echo off
title InvoiceOS - Starting...
echo.
echo  ============================================
echo   InvoiceOS - Starting Application
echo  ============================================
echo.
echo  Starting Django backend on http://localhost:8000
echo  Starting React frontend on http://localhost:3000
echo.
echo  Open your browser and go to: http://localhost:3000
echo  Login: admin@example.com / Admin@123
echo.
echo  Press Ctrl+C in either window to stop.
echo  ============================================
echo.

REM Start Django in a new window
start "InvoiceOS Backend" cmd /k "cd backend && python manage.py runserver 8000"

REM Wait 2 seconds then start React
timeout /t 2 /nobreak >nul

REM Start React in a new window
start "InvoiceOS Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting in separate windows.
echo Your browser will open automatically.
echo.
pause
