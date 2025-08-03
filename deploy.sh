#!/bin/bash

# ZeroDeploy Easy Deployment Script
# This script makes it easy to deploy ZeroDeploy with the new dark mode frontend

set -e

echo "🚀 Starting ZeroDeploy deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Default values
ENVIRONMENT="production"
PORT=""
DOMAIN_SUFFIX=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dev)
            ENVIRONMENT="development"
            shift
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        --domain)
            DOMAIN_SUFFIX="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -d, --dev           Use development mode"
            echo "  -p, --port PORT     Set port (auto-detected)"
            echo "  --domain DOMAIN     Set custom domain suffix (optional)"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set compose file based on environment
if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🛠️  Using development configuration"
else
    COMPOSE_FILE="docker-compose.yml"
    echo "🏭 Using production configuration"
fi

# Find available port if not specified
if [ -z "$PORT" ]; then
    # Try common ports in sequence
    for test_port in 8080 8081 8082 8083 8084 8085 3000 3001 3002 3003 3004 3005; do
        if ! nc -z localhost $test_port 2>/dev/null; then
            PORT=$test_port
            echo "🔍 Found available port: $PORT"
            break
        fi
    done
    
    if [ -z "$PORT" ]; then
        # Generate random port between 8000-9000
        PORT=$((8000 + RANDOM % 1000))
        echo "🎲 Using random port: $PORT"
    fi
fi

# Set environment variables
export DOMAIN_SUFFIX
export ZERO_DEPLOY_PORT=$PORT

echo "📋 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Port: $PORT"
echo "  Domain: $DOMAIN_SUFFIX"

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ ZeroDeploy is ready!"
    echo "🌐 Access your application at: http://localhost:$PORT"
    echo "🌙 Dark mode is available in the settings"
else
    echo "⚠️  Services are starting. Check http://localhost:$PORT in a few moments"
fi

echo "🎉 Deployment complete!"