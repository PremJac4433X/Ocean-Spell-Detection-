from fastapi import APIRouter
from app.api.dashboard import router as dashboard_router
from app.api.incidents import router as incidents_router
from app.api.detection import router as detection_router
from app.api.vessels import router as vessels_router
from app.api.investigations import router as investigations_router
from app.api.trajectory import router as trajectory_router
from app.api.environmental import router as environmental_router
from app.api.data_sources import router as data_sources_router
from app.api.reports import router as reports_router

api_router = APIRouter()

api_router.include_router(dashboard_router)
api_router.include_router(incidents_router)
api_router.include_router(detection_router)
api_router.include_router(vessels_router)
api_router.include_router(investigations_router)
api_router.include_router(trajectory_router)
api_router.include_router(environmental_router)
api_router.include_router(data_sources_router)
api_router.include_router(reports_router)

@api_router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Ocean Guard AI Engine",
        "version": "1.0.0",
        "database": "connected",
        "demo_mode": True
    }
