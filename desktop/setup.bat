@echo off
cd /d "%~dp0"

echo ________________________________
echo Md-X RPC Client Setup
echo ________________________________
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
echo ERROR: Node.js is not installed.
echo Download it from: https://nodejs.org
echo.
pause
exit /b 1

)

:: Install dependencies if missing
if not exist "node_modules" (
echo Installing dependencies...
npm install
npm install @xhayper/discord-rpc
echo.
echo Installation complete.
) else (
echo Dependencies already installed.
)

echo.
echo Setup finished successfully.
echo Press Enter to exit...
pause >nul
exit

