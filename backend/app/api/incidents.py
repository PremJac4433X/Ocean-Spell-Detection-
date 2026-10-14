import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Incident, Investigation, CandidateAssessment, Vessel, AuditLog
from app.schemas.schemas import IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])

def format_incident_dict(inc: Incident) -> dict:
    return {
        "id": inc.id,
        "incident_code": inc.incident_code,
        "name": inc.name,
        "status": inc.status,
        "severity": inc.severity,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "surface_area_km2": inc.surface_area_km2,
        "detection_method": inc.detection_method,
        "satellite_platform": inc.satellite_platform,
        "sensor_type": inc.sensor_type,
        "image_id": inc.image_id,
        "confidence_score": inc.confidence_score,
        "look_alike_probability": inc.look_alike_probability,
        "observation_time": inc.observation_time,
        "maritime_region": inc.maritime_region,
        "distance_to_coast_km": inc.distance_to_coast_km,
        "reviewer": inc.reviewer,
        "notes": inc.notes,
        "geometry_geojson": json.loads(inc.geometry_geojson) if isinstance(inc.geometry_geojson, str) else inc.geometry_geojson,
        "bounding_box": json.loads(inc.bounding_box) if inc.bounding_box else None,
        "is_demonstration": inc.is_demonstration,
        "created_at": str(inc.created_at),
        "updated_at": str(inc.updated_at)
    }

@router.get("")
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status and status != "All":
        query = query.filter(Incident.status == status)
    if severity and severity != "All":
        query = query.filter(Incident.severity == severity)
    if region and region != "All":
        query = query.filter(Incident.maritime_region.ilike(f"%{region}%"))
    
    incidents = query.order_by(Incident.created_at.desc()).all()
    return [format_incident_dict(i) for i in incidents]

@router.post("")
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    code_num = db.query(Incident).count() + 883
    incident_id = f"inc-{uuid.uuid4().hex[:8]}"
    incident_code = f"OG-2026-{code_num}"
    
    inc = Incident(
        id=incident_id,
        incident_code=incident_code,
        name=data.name,
        status="Unverified",
        severity=data.severity,
        latitude=data.latitude,
        longitude=data.longitude,
        bounding_box=json.dumps(data.bounding_box) if data.bounding_box else None,
        geometry_geojson=json.dumps(data.geometry_geojson),
        surface_area_km2=data.surface_area_km2,
        detection_method=data.detection_method,
        satellite_platform=data.satellite_platform,
        sensor_type=data.sensor_type,
        image_id=data.image_id,
        confidence_score=data.confidence_score,
        look_alike_probability=0.15,
        observation_time=data.observation_time,
        maritime_region=data.maritime_region,
        distance_to_coast_km=data.distance_to_coast_km,
        reviewer="Pending Assignment",
        notes=data.notes or "",
        is_demonstration=True
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Log action
    audit = AuditLog(
        timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        action="INCIDENT_MANUALLY_CREATED",
        user_role="Environmental Analyst",
        target_type="Incident",
        target_id=inc.incident_code,
        details=f"Created incident {inc.name} at [{inc.latitude}, {inc.longitude}]"
    )
    db.add(audit)
    db.commit()

    return format_incident_dict(inc)

@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter((Incident.id == incident_id) | (Incident.incident_code == incident_id)).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return format_incident_dict(inc)

@router.patch("/{incident_id}")
def update_incident(incident_id: str, data: IncidentUpdate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter((Incident.id == incident_id) | (Incident.incident_code == incident_id)).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = inc.status
    if data.status:
        inc.status = data.status
    if data.severity:
        inc.severity = data.severity
    if data.reviewer:
        inc.reviewer = data.reviewer
    if data.notes is not None:
        inc.notes = data.notes

    inc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)

    # Log review action
    audit = AuditLog(
        timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        action="INCIDENT_STATUS_MODIFIED",
        user_role="Senior Maritime Investigator",
        target_type="Incident",
        target_id=inc.incident_code,
        details=f"Status changed from {old_status} to {inc.status}. Reviewer: {inc.reviewer}"
    )
    db.add(audit)
    db.commit()

    return format_incident_dict(inc)

@router.get("/{incident_id}/candidates")
def get_incident_candidate_vessels(incident_id: str, db: Session = Depends(get_db)):
    """
    Returns candidate vessels assessed in connection with this incident, sorted by investigation priority score.
    Includes the mandatory legal and scientific disclaimer notice.
    """
    inc = db.query(Incident).filter((Incident.id == incident_id) | (Incident.incident_code == incident_id)).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Find candidate assessments linked to investigations for this incident
    assessments = (
        db.query(CandidateAssessment)
        .join(Investigation, CandidateAssessment.investigation_id == Investigation.id)
        .filter(Investigation.incident_id == inc.id)
        .order_by(CandidateAssessment.priority_rank.asc())
        .all()
    )

    formatted_candidates = []
    for ca in assessments:
        vessel = db.query(Vessel).filter(Vessel.id == ca.vessel_id).first()
        vessel_dict = None
        if vessel:
            vessel_dict = {
                "id": vessel.id,
                "name": vessel.name,
                "mmsi": vessel.mmsi,
                "imo": vessel.imo,
                "vessel_type": vessel.vessel_type,
                "flag": vessel.flag,
                "length_m": vessel.length_m,
                "destination": vessel.destination,
                "speed_knots": vessel.speed_knots,
                "nav_status": vessel.nav_status,
                "last_seen": vessel.last_seen
            }

        formatted_candidates.append({
            "id": ca.id,
            "vessel_id": ca.vessel_id,
            "vessel": vessel_dict,
            "priority_rank": ca.priority_rank,
            "priority_score": ca.priority_score,
            "temporal_score": ca.temporal_score,
            "spatial_score": ca.spatial_score,
            "route_score": ca.route_score,
            "speed_anomaly_score": ca.speed_anomaly_score,
            "ais_gap_score": ca.ais_gap_score,
            "supporting_evidence": json.loads(ca.supporting_evidence) if ca.supporting_evidence else [],
            "contradictory_evidence": json.loads(ca.contradictory_evidence) if ca.contradictory_evidence else [],
            "missing_evidence": json.loads(ca.missing_evidence) if ca.missing_evidence else [],
            "alternative_explanations": json.loads(ca.alternative_explanations) if ca.alternative_explanations else [],
            "verification_steps": json.loads(ca.verification_steps) if ca.verification_steps else [],
            "review_status": ca.review_status
        })

    return {
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_name": inc.name,
        "candidates_count": len(formatted_candidates),
        "legal_notice": (
            "Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility. "
            "Results depend on data availability, model assumptions, and independent verification."
        ),
        "candidates": formatted_candidates
    }
