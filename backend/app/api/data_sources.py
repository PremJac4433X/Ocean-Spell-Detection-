from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import DataSourceStatus
from app.services.noaa_service import NOAAMarineService

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])

@router.get("/status")
def get_data_sources_status(db: Session = Depends(get_db)):
    """
    Returns real-time health, latency, coverage, and provenance status of all connected data providers.
    Explicitly tags demonstration/simulated feeds vs live feeds.
    """
    sources = db.query(DataSourceStatus).all()
    results = []
    
    # Check live NOAA connection status
    noaa_probe = NOAAMarineService.test_connection()

    for s in sources:
        latency = s.latency_ms
        status = s.status
        is_simulated = s.is_simulated
        last_sync = s.last_sync

        if s.id == "ds-003" or "NOAA" in s.provider_name:
            if noaa_probe.get("is_live"):
                status = "Operational"
                is_simulated = False
                latency = noaa_probe.get("latency_ms", latency)
                last_sync = noaa_probe.get("last_sync", last_sync)
            elif noaa_probe.get("status") == "Degraded":
                status = "Degraded"

        results.append({
            "id": s.id,
            "provider_name": s.provider_name,
            "data_type": s.data_type,
            "last_sync": last_sync,
            "status": status,
            "latency_ms": latency,
            "coverage": s.coverage,
            "is_simulated": is_simulated,
            "records_count": s.records_count
        })
    return {
        "status": "healthy",
        "total_providers": len(results),
        "all_operational": all(s["status"] == "Operational" for s in results),
        "providers": results
    }
