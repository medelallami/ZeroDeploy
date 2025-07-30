from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# API routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "ZeroDeploy API is running"}

@app.get("/api/containers")
async def list_containers():
    """Get all running containers with their DNS status"""
    # For now, return a mock response
    return [
        {
            "id": "mock-container-1",
            "name": "mock-container-1",
            "status": "running",
            "dns_enabled": True
        },
        {
            "id": "mock-container-2",
            "name": "mock-container-2",
            "status": "running",
            "dns_enabled": False
        }
    ]