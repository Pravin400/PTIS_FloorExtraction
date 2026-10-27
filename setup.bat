@echo off
title PTIS & AI Floor Extraction - Automated Setup
color 0B
echo ========================================================
echo   PTIS Platform & AI Floor Extraction - One-Click Setup
echo ========================================================
echo.

REM 1. Setup Python Virtual Environment for Floor Plan Extraction
echo [1/3] Setting up Python AI Extraction Service...
cd /d "%~dp0floor-plan-extraction"
if not exist ".venv\Scripts\python.exe" (
    echo Creating Python virtual environment in .venv...
    python -m venv .venv 2>nul || py -3 -m venv .venv 2>nul || py -m venv .venv 2>nul
)
if exist ".venv\Scripts\python.exe" (
    echo Installing Python dependencies from requirements.txt...
    ".venv\Scripts\python.exe" -m pip install --upgrade pip
    ".venv\Scripts\python.exe" -m pip install --ignore-requires-python -r requirements.txt
    echo [OK] Python AI Extraction Service ready.
) else (
    echo [WARNING] Could not create virtual environment. Please ensure Python 3.10+ is installed and added to PATH.
)
echo.

REM 2. Install Frontend Dependencies
echo [2/3] Installing Frontend Dependencies (Next.js)...
cd /d "%~dp0ntis-ui-dev"
if exist "package.json" (
    call npm install
    echo [OK] Frontend dependencies installed.
) else (
    echo [WARNING] package.json not found in ntis-ui-dev.
)
echo.

REM 3. Restore .NET Backend Projects
echo [3/3] Restoring .NET Backend Solutions...
cd /d "%~dp0ntis-platform-dev"
set "PATH=C:\Program Files\dotnet;%PATH%"
call dotnet restore
if exist "%~dp0ntis-database-manager-dev" (
    cd /d "%~dp0ntis-database-manager-dev"
    call dotnet restore
)
echo [OK] .NET solutions restored.
echo.

cd /d "%~dp0"
echo ========================================================
echo   Setup Complete!
echo   Double-click 'start-all.bat' to launch all services.
echo ========================================================
echo.
pause
