@echo off
REM ZeroDeploy Port Checker Utility for Windows
REM Helps users find available ports for deployment

echo 🔍 ZeroDeploy Port Checker
echo ==========================

REM Function to check if port is available
echo Checking common ZeroDeploy ports:
echo.

setlocal enabledelayedexpansion
set available_ports=

for %%p in (8080 8081 8082 8083 8084 8085 3000 3001 3002 3003 3004 3005 8000 8001 8002 9000 9001) do (
    netstat -an | findstr ":%%p " >nul
    if errorlevel 1 (
        echo ✅ Port %%p: AVAILABLE
        set available_ports=!available_ports! %%p
    ) else (
        echo ❌ Port %%p: IN USE
    )
)

echo.
if not "%available_ports%"=="" (
    echo 🎯 Recommended ports:%available_ports%
) else (
    echo ⚠️  All common ports are in use
    echo 🎲 The deployment script will use a random port between 8000-9000
)

echo.
echo 💡 Usage examples:
echo   deploy.bat                    REM Auto-detect port
echo   set ZERO_DEPLOY_PORT=8082 ^& deploy.bat  REM Use specific port
echo   deploy.bat --port 3000        REM Use specific port via CLI

pause