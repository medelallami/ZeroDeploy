import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

# Import local modules
from docker_scan import get_running_containers
from zeronsd_writer import generate_config, reload_zeronsd

# Initialize FastAPI app
app = FastAPI(title="ZeroDeploy", description="Local DNS management for Docker containers")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
DOMAIN_SUFFIX = os.getenv("DOMAIN_SUFFIX", "vexinet.local")
DNS_CONFIG_PATH = os.getenv("DNS_CONFIG_PATH", "/app/config/config.toml")

# API routes
@app.get("/api/containers", response_model=List[Dict[str, Any]])
async def list_containers(remote_host: str = None):
    """Get all running containers with their DNS status"""
    try:
        containers = get_running_containers(remote_host)
        return containers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/remote-scan", response_model=Dict[str, Any])
async def scan_remote_host(request: Request):
    """Scan a remote Docker host for containers"""
    try:
        data = await request.json()
        remote_host = data.get("remote_host")
        
        if not remote_host:
            raise HTTPException(status_code=400, detail="Remote host URL is required")
            
        containers = get_running_containers(remote_host)
        return {"success": True, "containers": containers, "remote_host": remote_host}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/domains", response_model=Dict[str, Any])
async def get_domains(remote_host: str = None):
    """Get current DNS configuration"""
    try:
        # This would need to parse the current config.toml
        # For now, we'll just return the containers with domain info
        containers = get_running_containers(remote_host)
        domains = {}
        
        for container in containers:
            container_name = container["name"]
            domains[container_name] = {
                "name": f"{container_name}.{DOMAIN_SUFFIX}",
                "enabled": container.get("dns_enabled", True),
                "address": container.get("ip_address", "")
            }
            
        return {"domains": domains, "domain_suffix": DOMAIN_SUFFIX, "remote_host": remote_host}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/domains", response_model=Dict[str, Any])
async def update_domains(request: Request):
    """Update DNS configuration based on container data"""
    try:
        data = await request.json()
        container_configs = data.get("containers", [])
        remote_host = data.get("remote_host")
        
        # Generate new config
        success = generate_config(container_configs, domain_suffix=DOMAIN_SUFFIX)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to generate DNS configuration")
        
        # Reload ZeroNSD
        reload_success = reload_zeronsd()
        
        return {"success": reload_success, "message": "DNS configuration updated", "remote_host": remote_host}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reload", response_model=Dict[str, Any])
async def force_reload():
    """Force reload of ZeroNSD configuration"""
    try:
        success = reload_zeronsd()
        return {"success": success, "message": "DNS service reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files for frontend
@app.on_event("startup")
async def startup_event():
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

# Run the server if executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)