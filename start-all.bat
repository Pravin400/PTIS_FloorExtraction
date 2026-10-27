@echo off
title NTIS Platform Launcher
echo ========================================================
echo   Starting Backend, Frontend, and AI Extraction Services
echo ========================================================
echo.

echo [1/3] Launching AI Floor-Plan Extraction Service (Port 8000)...
start "PTIS AI Extraction Service" "%~dp0start-extraction.bat"
ping 127.0.0.1 -n 4 >nul 2>&1

echo [2/3] Launching Backend Web API (Port 7293)...
start "NTIS Backend API" "%~dp0start-backend.bat"
ping 127.0.0.1 -n 4 >nul 2>&1

echo [3/3] Launching Frontend Web UI (Port 3000)...
start "NTIS Frontend UI" "%~dp0start-frontend.bat"

echo.
echo ========================================================
echo All 3 services have been launched in separate windows:
echo.
echo [Local Access (on this machine)]:
echo - Frontend Web UI:        http://localhost:3000
echo - Backend API Swagger:    https://localhost:7293/swagger
echo - AI Extraction Docs:     http://localhost:8000/docs
echo.
echo [Network Access (LAN)]:
echo - Frontend Web UI:        http://192.168.2.67:3000
echo.
echo [Anywhere Access (Global Internet)]:
echo - Double-click "start-cloudflare-tunnel.bat" to get
echo   a public https link accessible from any phone or PC!
echo ========================================================
echo.
echo Opening http://localhost:3000 in your browser...
ping 127.0.0.1 -n 5 >nul 2>&1
start http://localhost:3000
echo.
pause
