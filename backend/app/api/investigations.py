import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Investigation, Incident, Vessel, VesselPosition, CandidateAssessment, AuditLog
from app.schemas.schemas import InvestigationCreate
from app.services.drift_simulator import DriftSimulator
from app.services.vessel_ranker import VesselRanker

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.get("")
def list_investigations(db: Session = Depends(get_db)):
    invs = db.query(Investigation).order_by(Investigation.created_at.desc()).all()
    results = []
    for inv in invs:
        candidate_count = db.query(CandidateAssessment).filter(CandidateAssessment.investigation_id == inv.id).count()
        results.append({
            "id": inv.id,
            "incident_id": inv.incident_id,
            "title": inv.title,
            "time_window_start": inv.time_window_start,
            "time_window_end": inv.time_window_end,
            "geographic_radius_nm": inv.geographic_radius_nm,
            "status": inv.status,
            "candidates_count": candidate_count,
            "created_at": str(inv.created_at)
        })
    return results

@router.post("")
def create_investigation(data: InvestigationCreate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == data.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inv_id = f"inv-{uuid.uuid4().hex[:8]}"
    inv = Investigation(
        id=inv_id,
        incident_id=inc.id,
        title=data.title,
        time_window_start=data.time_window_start,
        time_window_end=data.time_window_end,
        geographic_radius_nm=data.geographic_radius_nm,
        status="Analysis In Progress"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Immediately compute initial ranking
    rank_investigation_vessels(inv.id, db)

    return {
        "id": inv.id,
        "incident_id": inv.incident_id,
        "title": inv.title,
        "status": inv.status,
        "created_at": str(inv.created_at)
    }

@router.get("/{investigation_id}")
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inc = db.query(Incident).filter(Incident.id == inv.incident_id).first()
    candidates = (
        db.query(CandidateAssessment)
        .filter(CandidateAssessment.investigation_id == inv.id)
        .order_by(CandidateAssessment.priority_rank.asc())
        .all()
    )

    formatted_candidates = []
    for ca in candidates:
        vessel = db.query(Vessel).filter(Vessel.id == ca.vessel_id).first()
        formatted_candidates.append({
            "id": ca.id,
            "vessel_id": ca.vessel_id,
            "vessel_name": vessel.name if vessel else "Unknown",
            "vessel_type": vessel.vessel_type if vessel else "N/A",
            "flag": vessel.flag if vessel else "N/A",
            "mmsi": vessel.mmsi if vessel else "",
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
        "id": inv.id,
        "incident_id": inv.incident_id,
        "incident_name": inc.name if inc else "",
        "incident_code": inc.incident_code if inc else "",
        "title": inv.title,
        "time_window_start": inv.time_window_start,
        "time_window_end": inv.time_window_end,
        "geographic_radius_nm": inv.geographic_radius_nm,
        "status": inv.status,
        "created_at": str(inv.created_at),
        "legal_notice": VesselRanker.NOTICE,
        "candidates": formatted_candidates
    }

@router.post("/{investigation_id}/rank-vessels")
def rank_investigation_vessels(investigation_id: str, db: Session = Depends(get_db)):
    """
    Executes or re-calculates the multi-criteria vessel investigation priority ranking.
    Adheres strictly to the transparent evidence breakdown and legal notice.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inc = db.query(Incident).filter(Incident.id == inv.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Run backward backtrack from incident coordinates to derive plausible origin corridor
    backtrack = DriftSimulator.run_backward_backtrack(
        observed_lat=inc.latitude,
        observed_lon=inc.longitude,
        hours_back=8
    )

    all_vessels = db.query(Vessel).all()
    evaluations = []

    for v in all_vessels:
        v_positions = db.query(VesselPosition).filter(VesselPosition.vessel_id == v.id).all()
        pos_dicts = [
            {
                "latitude": p.latitude,
                "longitude": p.longitude,
                "speed_knots": p.speed_knots,
                "course_deg": p.course_deg,
                "ais_gap_flag": p.ais_gap_flag
            }
            for p in v_positions
        ]
        eval_res = VesselRanker.evaluate_vessel(
            vessel_dict={"id": v.id, "name": v.name, "vessel_type": v.vessel_type},
            positions=pos_dicts,
            spill_lat=inc.latitude,
            spill_lon=inc.longitude,
            backtrack_points=backtrack["backtrack_points"]
        )
        evaluations.append(eval_res)

    evaluations.sort(key=lambda x: x["priority_score"], reverse=True)

    # Clear old assessments for this investigation
    db.query(CandidateAssessment).filter(CandidateAssessment.investigation_id == inv.id).delete()

    saved_assessments = []
    for rank_idx, ev in enumerate(evaluations, 1):
        ca = CandidateAssessment(
            investigation_id=inv.id,
            vessel_id=ev["vessel_id"],
            priority_rank=rank_idx,
            priority_score=ev["priority_score"],
            temporal_score=ev["temporal_score"],
            spatial_score=ev["spatial_score"],
            route_score=ev["route_score"],
            speed_anomaly_score=ev["speed_anomaly_score"],
            ais_gap_score=ev["ais_gap_score"],
            supporting_evidence=json.dumps(ev["supporting_evidence"]),
            contradictory_evidence=json.dumps(ev["contradictory_evidence"]),
            missing_evidence=json.dumps(ev["missing_evidence"]),
            alternative_explanations=json.dumps(ev["alternative_explanations"]),
            verification_steps=json.dumps(ev["verification_steps"]),
            review_status=ev["review_status"]
        )
        db.add(ca)
        saved_assessments.append(ev)

    db.commit()

    return {
        "investigation_id": inv.id,
        "ranked_vessels_count": len(saved_assessments),
        "legal_notice": VesselRanker.NOTICE,
        "results": saved_assessments
    }
