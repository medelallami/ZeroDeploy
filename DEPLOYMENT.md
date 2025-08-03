# ZeroDeploy Easy Deployment Guide

This guide provides simple steps to deploy ZeroDeploy with the new dark mode frontend.

## Quick Start

### Option 1: Using Scripts (Recommended)

#### For Linux/macOS:
```bash
# Make the script executable
chmod +x deploy.sh

# Deploy in production mode
./deploy.sh

# Deploy in development mode
./deploy.sh --dev

# Custom port only
./deploy.sh --port 3000

# Custom domain (optional)
./deploy.sh --port 3000 --domain mydomain.local

# Domain only (with auto port)
./deploy.sh --domain mydomain.local
```

#### For Windows:
```cmd
# Simply run the batch file
deploy.bat

# Or with custom settings
deploy.bat --dev --port 3000 --domain mydomain.local
```

### Option 2: Manual Docker Compose

#### Production Deployment:
```bash
docker-compose up --build -d
```

#### Development Deployment:
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

## Features

- ✅ **Dark Mode Support**: New frontend includes full dark mode toggle
- ✅ **Health Checks**: Built-in health monitoring for services
- ✅ **Easy Configuration**: Simple environment variables
- ✅ **Development Mode**: Hot reload and debug features
- ✅ **Production Ready**: Optimized for production deployment

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN_SUFFIX` | `optional` | DNS domain suffix (leave empty for system defaults) |
| `ENVIRONMENT` | `production` | Environment mode |
| `ZERO_DEPLOY_PORT` | `auto` | Application port (auto-detects if empty) |

### Ports

- **Auto-detected**: Main application port (8080-8085, 3000-3005, or random 8000-9000)
- **8000**: Internal API port (container-internal)

### Port Configuration

The deployment automatically handles port conflicts:
1. **Auto-detection**: Tries common ports (8080, 8081, 8082, etc.)
2. **Random fallback**: Uses random port 8000-9000 if all common ports are busy
3. **Manual override**: Set `ZERO_DEPLOY_PORT` in .env file or use CLI arguments

## Accessing the Application

After successful deployment:

1. **Web Interface**: http://localhost:8080
2. **API Health Check**: http://localhost:8080/health
3. **Dark Mode**: Toggle available in the top-right corner

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port using scripts
   ./deploy.sh --port 3000
   ```

2. **Docker Permission Issues**
   ```bash
   # Linux: Add user to docker group
   sudo usermod -aG docker $USER
   ```

3. **Build Failures**
   ```bash
   # Clean and rebuild
   docker-compose down
   docker system prune -f
   ./deploy.sh
   ```

### Health Checks

The application includes health checks that verify:
- Frontend is serving correctly
- API endpoints are accessible
- Container services are running

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f zerodeploy
```

## Development Mode

For development with hot reload:

1. Use `docker-compose.dev.yml`
2. Mounts source code for live changes
3. Enables debug mode
4. Includes development tools

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Production Deployment

For production deployment:

1. Uses optimized Dockerfile
2. Includes health checks
3. Runs in production mode
4. Optimized for performance

```bash
./deploy.sh
```

## SSL/TLS Setup

For HTTPS deployment, place SSL certificates in `./ssl/`:
- `cert.pem`: SSL certificate
- `key.pem`: Private key

Then use the nginx profile:
```bash
docker-compose --profile nginx up --build -d
```

## Support

For issues or questions:
1. Check the health endpoint: http://localhost:8080/health
2. Review logs: `docker-compose logs`
3. Verify configuration in `.env` file