@echo off
title NTIS Platform Launcher
echo ========================================================
echo   Starting Backend, Frontend, and AI Extraction Services
echo ========================================================
echo.

start "PTIS AI Extraction Service" "%~dp0start-extraction.bat"
timeout /t 2 /nobreak >nul
start "NTIS Backend API" "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul
start "NTIS Frontend UI" "%~dp0start-frontend.bat"

echo.
echo All 3 services have been launched in separate windows:
echo - Frontend UI:          http://localhost:3000
echo - Backend API:          https://localhost:7293/swagger
echo - AI Extraction Service: http://localhost:8000/docs
echo.
pause
