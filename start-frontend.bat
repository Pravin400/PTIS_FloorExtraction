@echo off
title NTIS Frontend UI (Next.js 16)
color 0B
echo ========================================================
echo         Starting NTIS Platform Frontend UI
echo ========================================================
echo.
cd /d "%~dp0ntis-ui-dev"

echo Starting Next.js Dev Server on http://localhost:3000 ...
echo.
npm run dev
pause
