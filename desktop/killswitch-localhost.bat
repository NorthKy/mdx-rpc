@echo off
set PORT=43215

echo Checking port %PORT%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT%') do (
    echo Killing process %%a using port %PORT%...
    taskkill /F /PID %%a >nul 2>&1
)

echo Done.
pause