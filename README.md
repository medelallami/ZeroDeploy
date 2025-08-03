# ZeroDeploy 🚀

**ZeroDeploy** is a powerful local DNS management tool that automatically maps Docker containers to domain names within a ZeroTier network. With an enhanced web dashboard, dark mode support, and intelligent deployment features, managing your container domains has never been easier.

## ⚠️ Disclaimer
- ⚠️ The project is under very active development.
- ⚠️ Expect bugs and breaking changes.
- ⚠️ Do not use the app as the only way to store your photos and videos.

## 🌟 What's New

- ✨ **Dark Mode Support** - System preference detection with manual toggle
- 🔄 **Automatic Port Randomization** - Prevents port conflicts during deployment
- 🎯 **Optional Domain Configuration** - No more hardcoded domain suffixes
- 🚀 **Enhanced Deployment Scripts** - Cross-platform deployment made simple
- 📊 **Container Statistics** - Real-time container resource monitoring
- 📝 **DNS Logging** - Comprehensive DNS query logging and analysis

## 🚀 Key Features

### Core Features
- **Smart Container Discovery** - Automatically detects running containers and exposed ports
- **Dynamic DNS Management** - Real-time DNS configuration updates based on container state
- **ZeroTier Integration** - Seamless DNS resolution across ZeroTier networks
- **RESTful API** - Complete programmatic control via REST endpoints

### Enhanced Features
- **Dark Mode Interface** - Modern UI with system preference detection
- **Container Analytics** - Real-time CPU, memory, and network statistics
- **DNS Query Logging** - Detailed DNS request monitoring and analysis
- **Health Monitoring** - Built-in health checks for all services
- **Port Conflict Prevention** - Automatic port detection and assignment

## 🏗️ System Architecture

### Core Components
1. **Container Monitor Service** - Real-time Docker container state tracking
2. **DNS Configuration Engine** - Dynamic ZeroNSD configuration generation
3. **REST API Server** - FastAPI-based management endpoints
4. **Modern Web Dashboard** - React-based responsive interface
5. **Deployment Automation** - Cross-platform deployment scripts

### Enhanced Components
- **Statistics Collector** - Container resource usage monitoring
- **DNS Logger** - Query logging and analysis system
- **Health Check System** - Service availability monitoring
- **Port Manager** - Automatic port conflict resolution

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- ZeroTier network configured (optional)
- Git for cloning the repository

### One-Command Deployment

#### Linux/macOS
```bash
git clone https://github.com/yourusername/ZeroDeploy.git
cd ZeroDeploy
./deploy.sh
```

#### Windows
```powershell
git clone https://github.com/yourusername/ZeroDeploy.git
cd ZeroDeploy
.\deploy.bat
```

### Manual Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/ZeroDeploy.git
cd ZeroDeploy

# Copy environment template
cp .env.example .env

# Edit configuration as needed
nano .env

# Deploy with Docker Compose
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables
Configure your deployment using the `.env` file:

```bash
# Application Settings
ENVIRONMENT=production
ZERO_DEPLOY_PORT=auto           # Auto-detect available port
DOMAIN_SUFFIX=                  # Optional domain suffix

# Docker Settings
DOCKER_NETWORK=zerodeploy_default
DOCKER_RESTART_POLICY=unless-stopped

# Advanced Settings
HEALTH_CHECK_INTERVAL=30s
LOG_LEVEL=info
```

### Port Configuration
- **Automatic Detection**: Uses `check-ports.sh`/`check-ports.bat` to find available ports
- **Manual Override**: Set `ZERO_DEPLOY_PORT=8080` for specific port
- **Development Mode**: Uses `docker-compose.dev.yml` for hot-reload development

## 🖥️ Web Dashboard

### Access Points
- **Main Dashboard**: http://localhost:[auto-detected-port]
- **API Documentation**: http://localhost:[port]/docs
- **Health Check**: http://localhost:[port]/health

### Features
- **Dark Mode Toggle** - Automatic system preference detection
- **Container Management** - Start, stop, and configure containers
- **Domain Mapping** - Assign custom domains to containers
- **Real-time Statistics** - Live container resource usage
- **DNS Query Logs** - View and analyze DNS requests

## 🔧 Advanced Usage

### Development Mode
```bash
# Start in development mode with hot-reload
./deploy.sh --env dev --port 3000
```

### Custom Domain Configuration
```bash
# Deploy with custom domain suffix
./deploy.sh --domain mycompany.local
```

### Port Management
```bash
# Check available ports
./check-ports.sh          # Linux/macOS
.\check-ports.bat        # Windows

# Deploy on specific port
./deploy.sh --port 8080
```

## 📊 Container Statistics

Monitor your containers with real-time metrics:
- **CPU Usage** - Per-container CPU utilization
- **Memory Usage** - RAM consumption tracking
- **Network I/O** - Traffic monitoring
- **Container Health** - Service availability status

## 📝 DNS Logging

Comprehensive DNS query analysis:
- **Query Tracking** - Log all DNS requests
- **Response Analysis** - Monitor DNS resolution
- **Performance Metrics** - Query response times
- **Error Detection** - Identify DNS issues

## 🐛 Troubleshooting

### Common Issues
- **Port Conflicts**: Use automatic port detection
- **Permission Errors**: Ensure Docker daemon access
- **Network Issues**: Check ZeroTier network configuration

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug ./deploy.sh
```

### Health Checks
- Container health monitoring
- Service availability checks
- DNS resolution verification

## 🌐 ZeroTier Integration

### Network Setup
1. Create ZeroTier network at https://my.zerotier.com
2. Join your devices to the network
3. Configure ZeroDeploy with your network ID
4. Access containers via domain names from any network device

### Domain Resolution
- **Local Network**: http://container-name.local
- **ZeroTier Network**: http://container-name.yourdomain.local
- **Cross-Platform**: Works on Windows, macOS, Linux, and mobile devices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ZeroTier](https://www.zerotier.com/) for the excellent networking platform
- [Docker](https://www.docker.com/) for containerization
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [React](https://reactjs.org/) for the frontend framework

---

**Made with ❤️ by the ZeroDeploy Community**
