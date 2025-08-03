#!/bin/bash

# ZeroDeploy Port Checker Utility
# Helps users find available ports for deployment

echo "🔍 ZeroDeploy Port Checker"
echo "=========================="

# Function to check if port is available
check_port() {
    local port=$1
    if nc -z localhost $port 2>/dev/null; then
        echo "❌ Port $port: IN USE"
        return 1
    else
        echo "✅ Port $port: AVAILABLE"
        return 0
    fi
}

# Check common ports
echo "Checking common ZeroDeploy ports:"
echo ""

available_ports=()
for port in 8080 8081 8082 8083 8084 8085 3000 3001 3002 3003 3004 3005 8000 8001 8002 9000 9001; do
    if check_port $port; then
        available_ports+=($port)
    fi
done

echo ""
if [ ${#available_ports[@]} -gt 0 ]; then
    echo "🎯 Recommended ports: ${available_ports[*]}"
else
    echo "⚠️  All common ports are in use"
    echo "🎲 The deployment script will use a random port between 8000-9000"
fi

echo ""
echo "💡 Usage examples:"
echo "  ./deploy.sh                    # Auto-detect port"
echo "  ZERO_DEPLOY_PORT=8082 ./deploy.sh  # Use specific port"
echo "  ./deploy.sh --port 3000        # Use specific port via CLI"