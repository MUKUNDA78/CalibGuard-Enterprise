@echo off
title Quality Team & Rejection Monitor Local Server
cd /d "%~dp0"
echo ========================================================
echo Quality Team & Production Rejection/Rework Monitor
echo Starting Local Web Server on http://localhost:8080
echo ========================================================
echo.
powershell -ExecutionPolicy Bypass -File .\server.ps1
pause
