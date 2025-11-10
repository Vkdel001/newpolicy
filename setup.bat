@echo off
echo ========================================
echo NICL Letter Generator - Setup Script
echo ========================================
echo.

echo Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend installation failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Open a terminal and run: cd backend ^&^& npm run dev
echo 2. Open another terminal and run: cd frontend ^&^& npm run dev
echo 3. Open browser at http://localhost:5173
echo.
pause
