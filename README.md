# ZeroDeploy

ZeroDeploy is a local DNS management tool that automatically maps Docker containers to domain names within a ZeroTier network. It provides a web dashboard for easy management and configuration.

## Disclaimer
⚠️ The project is under very active development.
⚠️ Expect bugs and breaking changes.
⚠️ Do not use the app as the only way to store your photos and videos.

## Features

- **Docker Container Monitoring**: Automatically detects running containers and their exposed ports
- **Dynamic DNS Configuration**: Generates ZeroNSD configuration files based on container information
- **Web Dashboard**: Provides a user-friendly interface to manage domain mappings
- **API Endpoints**: Offers REST API for programmatic control
- **Dockerized Deployment**: Easy setup with Docker Compose

## System Components

1. **Docker Monitor Module**: Watches Docker containers and extracts container information
2. **ZeroNSD Config Generator**: Converts container info into DNS configuration
3. **Web API (FastAPI)**: Exposes endpoints to manage domains and configuration
4. **Web Dashboard**: Provides a user interface for domain management

## Getting Started

### Prerequisites

- Docker and Docker Compose
- ZeroTier network setup

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/ZeroDeploy.git
   cd ZeroDeploy
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the web dashboard at http://localhost:8000

## Configuration

The following environment variables can be configured in the docker-compose.yml file:

- `DOMAIN_SUFFIX`: The domain suffix to use (default: vexinet.local)
- `ZERO_TIER_INTERFACE`: Optional interface binding
- `DNS_CONFIG_PATH`: Path to ZeroNSD config file

## Usage

Once the application is running, you can:

1. View all running containers in the web dashboard
2. Enable/disable domain mappings for specific containers
3. Manually trigger DNS configuration reload
4. Access containers using their domain names from any device on the ZeroTier network

## License

MIT
