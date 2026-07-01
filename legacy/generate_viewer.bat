@echo off
title Notes Viewer Generator
echo ===================================================
echo   Notes Viewer Generator
echo ===================================================
echo.
echo Running builder script...
echo.

node "%~dp0generate_viewer.js"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Viewer generation failed!
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Viewer compiled successfully!
echo.
pause
