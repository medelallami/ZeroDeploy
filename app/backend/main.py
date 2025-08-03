import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

# Import local modules
from backend.docker_scan import get_running_containers, get_container_by_name
from backend.zeronsd_writer import generate_config, reload_zeronsd
from backend.container_stats import get_container_stats, get_container_logs
from backend.dns_logs import log_dns_access, get_recent_dns_accesses

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
        
@app.get("/api/containers/{container_id}/stats", response_model=Dict[str, Any])
async def get_stats(container_id: str, remote_host: str = None):
    """Get statistics for a specific container"""
    try:
        stats = get_container_stats(container_id, remote_host)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/containers/{container_id}/logs", response_model=List[Dict[str, Any]])
async def get_logs(container_id: str, lines: int = Query(100, ge=1, le=1000), remote_host: str = None):
    """Get logs for a specific container"""
    try:
        logs = get_container_logs(container_id, lines, remote_host)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dns/logs", response_model=List[Dict[str, Any]])
async def get_dns_logs(count: int = Query(5, ge=1, le=100)):
    """Get recent DNS access logs"""
    try:
        logs = get_recent_dns_accesses(count)
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dns/logs")
async def add_dns_log(request: Request):
    """Add a DNS access log entry"""
    try:
        data = await request.json()
        ip_address = data.get("ip_address")
        domain = data.get("domain")
        
        if not ip_address or not domain:
            raise HTTPException(status_code=400, detail="IP address and domain are required")
            
        log_dns_access(ip_address, domain)
        return {"success": True, "message": "DNS access logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files for frontend
@app.on_event("startup")
async def startup_event():
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

# Run the server if executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)