@echo off
title PTIS AI Floor-Plan Extraction Service
cd /d "%~dp0"

echo ========================================================
echo Starting PTIS AI Floor-Plan Extraction Service...
echo ========================================================

if exist ".venv\Scripts\python.exe" (
    echo Using virtual environment .venv...
    ".venv\Scripts\python.exe" main.py
) else (
    echo Virtual environment not found, using system Python...
    python main.py
)
pause
pause

