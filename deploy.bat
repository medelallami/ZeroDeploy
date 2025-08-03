@echo off
REM ZeroDeploy Easy Deployment Script for Windows
REM This script makes it easy to deploy ZeroDeploy with the new dark mode frontend

echo 🚀 Starting ZeroDeploy deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Default values
set ENVIRONMENT=production
set PORT=
set DOMAIN_SUFFIX=
set COMPOSE_FILE=docker-compose.yml

REM Parse command line arguments
:parse_args
if "%~1"=="-d" goto set_dev
if "%~1"=="--dev" goto set_dev
if "%~1"=="-p" goto set_port
if "%~1"=="--port" goto set_port
if "%~1"=="--domain" goto set_domain
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help
if "%~1"=="" goto continue_deployment
goto unknown_arg

:set_dev
set ENVIRONMENT=development
set COMPOSE_FILE=docker-compose.dev.yml
echo 🛠️  Using development configuration
shift
goto parse_args

:set_port
set PORT=%~2
shift
shift
goto parse_args

:set_domain
set DOMAIN_SUFFIX=%~2
shift
shift
goto parse_args

:show_help
echo Usage: %~nx0 [OPTIONS]
echo Options:
echo   -d, --dev           Use development mode
echo   -p, --port PORT     Set port (auto-detected)
echo   --domain DOMAIN     Set custom domain suffix (optional)
echo   -h, --help          Show this help message
pause
exit /b 0

:unknown_arg
echo Unknown option: %~1
pause
exit /b 1

:continue_deployment
REM Find available port if not specified
if "%PORT%"=="" (
    REM Try common ports in sequence
    for %%p in (8080 8081 8082 8083 8084 8085 3000 3001 3002 3003 3004 3005) do (
        netstat -an | findstr ":%%p " >nul
        if errorlevel 1 (
            set PORT=%%p
            echo 🔍 Found available port: !PORT!
            goto port_found
        )
    )
    
    REM Generate random port between 8000-9000
    set /a PORT=%random% %% 1000 + 8000
    echo 🎲 Using random port: !PORT!
)

:port_found
echo 📋 Configuration:
echo   Environment: %ENVIRONMENT%
echo   Port: %PORT%
echo   Domain: %DOMAIN_SUFFIX%

REM Pull latest images
echo 📥 Pulling latest images...
docker-compose -f %COMPOSE_FILE% pull

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f %COMPOSE_FILE% up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check health
echo 🏥 Checking service health...
curl -f http://localhost:%PORT%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ZeroDeploy is ready!
    echo 🌐 Access your application at: http://localhost:%PORT%
    echo 🌙 Dark mode is available in the settings
) else (
    echo ⚠️  Services are starting. Check http://localhost:%PORT% in a few moments
)

echo 🎉 Deployment complete!
pause