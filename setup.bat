@echo off
title InvoiceOS - First Time Setup
echo.
echo  ============================================
echo   InvoiceOS - First Time Setup
echo  ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Please install Python from https://python.org
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.
echo --- Setting up Backend (Django) ---
cd backend
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python packages
    pause
    exit /b 1
)
echo [OK] Python packages installed

python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed
    pause
    exit /b 1
)
echo [OK] Database created (db.sqlite3)

python manage.py seed_admin
echo [OK] Admin user created

cd ..

echo.
echo --- Setting up Frontend (React) ---
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK] Frontend packages installed
cd ..

echo.
echo  ============================================
echo   Setup Complete!
echo  ============================================
echo.
echo   Now run:  start.bat
echo.
pause
