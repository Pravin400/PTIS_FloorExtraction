@echo off
title NTIS Frontend UI (Next.js 16)
color 0B
echo ========================================================
echo         Starting NTIS Platform Frontend UI
echo ========================================================
echo.
echo Local URL:   http://localhost:3000
echo Network URL: http://192.168.2.67:3000
echo.
cd /d "%~dp0ntis-ui-dev"

npm run dev
pause
