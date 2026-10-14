from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Vessel, VesselPosition
from app.schemas.schemas import VesselResponse, VesselDetailResponse, VesselPositionResponse

router = APIRouter(prefix="/vessels", tags=["Vessels"])

def format_vessel_dict(v: Vessel) -> dict:
    return {
        "id": v.id,
        "mmsi": v.mmsi,
        "imo": v.imo,
        "name": v.name,
        "vessel_type": v.vessel_type,
        "flag": v.flag,
        "length_m": v.length_m,
        "width_m": v.width_m,
        "draught_m": v.draught_m,
        "destination": v.destination,
        "speed_knots": v.speed_knots,
        "course_deg": v.course_deg,
        "heading_deg": v.heading_deg,
        "nav_status": v.nav_status,
        "last_seen": v.last_seen,
        "data_provider": v.data_provider,
        "is_demonstration": v.is_demonstration
    }

@router.get("", response_model=List[VesselResponse])
def list_vessels(
    query: Optional[str] = Query(None),
    vessel_type: Optional[str] = Query(None),
    min_speed: Optional[float] = Query(None),
    max_speed: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Vessel)
    if query:
        search_filter = f"%{query}%"
        q = q.filter(
            (Vessel.name.ilike(search_filter)) |
            (Vessel.mmsi.ilike(search_filter)) |
            (Vessel.imo.ilike(search_filter))
        )
    if vessel_type and vessel_type != "All":
        q = q.filter(Vessel.vessel_type == vessel_type)
    if min_speed is not None:
        q = q.filter(Vessel.speed_knots >= min_speed)
    if max_speed is not None:
        q = q.filter(Vessel.speed_knots <= max_speed)

    vessels = q.all()
    return [format_vessel_dict(v) for v in vessels]

@router.get("/{vessel_id}", response_model=VesselDetailResponse)
def get_vessel(vessel_id: str, db: Session = Depends(get_db)):
    v = db.query(Vessel).filter((Vessel.id == vessel_id) | (Vessel.mmsi == vessel_id)).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vessel not found")

    positions = (
        db.query(VesselPosition)
        .filter(VesselPosition.vessel_id == v.id)
        .order_by(VesselPosition.timestamp.asc())
        .all()
    )

    resp = format_vessel_dict(v)
    resp["positions"] = [
        {
            "id": p.id,
            "timestamp": p.timestamp,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "speed_knots": p.speed_knots,
            "course_deg": p.course_deg,
            "is_interpolated": p.is_interpolated,
            "ais_gap_flag": p.ais_gap_flag
        }
        for p in positions
    ]
    return resp

@router.get("/{vessel_id}/tracks")
def get_vessel_tracks(vessel_id: str, db: Session = Depends(get_db)):
    """
    Returns full AIS track history and GeoJSON LineString representation for map visualization.
    """
    v = db.query(Vessel).filter((Vessel.id == vessel_id) | (Vessel.mmsi == vessel_id)).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vessel not found")

    positions = (
        db.query(VesselPosition)
        .filter(VesselPosition.vessel_id == v.id)
        .order_by(VesselPosition.timestamp.asc())
        .all()
    )

    coordinates = [[p.longitude, p.latitude] for p in positions]
    geojson_track = {
        "type": "Feature",
        "properties": {
            "vessel_id": v.id,
            "vessel_name": v.name,
            "vessel_type": v.vessel_type,
            "mmsi": v.mmsi,
            "flag": v.flag
        },
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        }
    }

    return {
        "vessel_id": v.id,
        "vessel_name": v.name,
        "points_count": len(positions),
        "positions": [
            {
                "id": p.id,
                "timestamp": p.timestamp,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "speed_knots": p.speed_knots,
                "course_deg": p.course_deg,
                "is_interpolated": p.is_interpolated,
                "ais_gap_flag": p.ais_gap_flag
            }
            for p in positions
        ],
        "geojson": geojson_track
    }
