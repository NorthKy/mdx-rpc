@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Download from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Launching MangaDex Presence in background...
echo Check your system tray ^(bottom-right^) for the icon.
wscript start.vbs
exit
