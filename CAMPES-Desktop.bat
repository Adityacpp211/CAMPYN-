@echo off
title CAMPES Desktop Launcher
cd /d "%~dp0"
echo =====================================================
echo   CAMPES - Systeme d'Information Universitaire
echo   Launching Standalone Windows Desktop Application...
echo =====================================================

:: Ensure backend is active
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 2 -UseBasicParsing).StatusCode } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo Starting CAMPES Enterprise API Server in background...
    start "CAMPES Backend Server" /min cmd /c "npm run dev:server"
    timeout /t 3 /nobreak >nul
)

echo Starting native Desktop Application Window...
node ".\node_modules\electron\cli.js" .
