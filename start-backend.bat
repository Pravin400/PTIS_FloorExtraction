@echo off
title NTIS Backend API (.NET 10)
color 0A
echo ========================================================
echo         Starting NTIS Platform Backend API
echo ========================================================
echo.
cd /d "%~dp0ntis-platform-dev\src\Presentation\NtisPlatform.Api"

REM Set PATH to include .NET if not already present
set "PATH=C:\Program Files\dotnet;%PATH%"

echo Starting API on https://0.0.0.0:7293 ...
echo Local Swagger:   https://localhost:7293/swagger
echo Network Swagger: https://192.168.2.67:7293/swagger
echo.
dotnet run --launch-profile https
pause
