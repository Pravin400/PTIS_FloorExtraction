@echo off
title NTIS Platform Launcher
echo ========================================================
echo   Starting Backend, Frontend, and AI Extraction Services
echo ========================================================
echo.

echo [1/3] Launching AI Floor-Plan Extraction Service (Port 8000)...
start "PTIS AI Extraction Service" "%~dp0start-extraction.bat"
timeout /t 3 /nobreak >nul

echo [2/3] Launching Backend Web API (Port 7293)...
start "NTIS Backend API" "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul

echo [3/3] Launching Frontend Web UI (Port 3000)...
start "NTIS Frontend UI" "%~dp0start-frontend.bat"

echo.
echo ========================================================
echo All 3 services have been launched in separate windows:
echo - Frontend UI:           http://localhost:3000
echo - Backend API:           https://localhost:7293/swagger
echo - AI Extraction Service: http://localhost:8000/docs
echo ========================================================
echo.
echo Opening http://localhost:3000 in your browser...
timeout /t 4 /nobreak >nul
start http://localhost:3000
echo.
pause
