import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Incident, Investigation, CandidateAssessment, Vessel, TrajectorySimulation, EnvironmentalAsset
from app.services.vessel_ranker import VesselRanker

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{incident_id}")
def generate_incident_report(incident_id: str, db: Session = Depends(get_db)):
    """
    Assembles a comprehensive scientific and intelligence dossier for the selected incident.
    Includes data provenance, detection confidence, candidate ranking with evidence breakdowns,
    environmental exposure, and mandatory limitation disclaimers.
    """
    inc = db.query(Incident).filter((Incident.id == incident_id) | (Incident.incident_code == incident_id)).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inv = db.query(Investigation).filter(Investigation.incident_id == inc.id).first()
    candidates = []
    if inv:
        ca_list = db.query(CandidateAssessment).filter(CandidateAssessment.investigation_id == inv.id).order_by(CandidateAssessment.priority_rank.asc()).all()
        for ca in ca_list:
            v = db.query(Vessel).filter(Vessel.id == ca.vessel_id).first()
            candidates.append({
                "rank": ca.priority_rank,
                "vessel_name": v.name if v else "Unknown",
                "mmsi": v.mmsi if v else "",
                "vessel_type": v.vessel_type if v else "",
                "flag": v.flag if v else "",
                "priority_score": ca.priority_score,
                "temporal_score": ca.temporal_score,
                "spatial_score": ca.spatial_score,
                "route_score": ca.route_score,
                "speed_anomaly_score": ca.speed_anomaly_score,
                "ais_gap_score": ca.ais_gap_score,
                "supporting_evidence": json.loads(ca.supporting_evidence) if ca.supporting_evidence else [],
                "contradictory_evidence": json.loads(ca.contradictory_evidence) if ca.contradictory_evidence else [],
                "missing_evidence": json.loads(ca.missing_evidence) if ca.missing_evidence else [],
                "review_status": ca.review_status
            })

    sim = db.query(TrajectorySimulation).filter(TrajectorySimulation.incident_id == inc.id).order_by(TrajectorySimulation.run_timestamp.desc()).first()
    env_assets = db.query(EnvironmentalAsset).all()

    report_dossier = {
        "report_id": f"REP-OG-{inc.incident_code}-2026",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "platform": "Ocean Guard AI Maritime Surveillance Suite v1.0",
        "incident": {
            "incident_code": inc.incident_code,
            "name": inc.name,
            "status": inc.status,
            "severity": inc.severity,
            "coordinates": f"{inc.latitude:.4f}°N, {inc.longitude:.4f}°E",
            "observation_time": inc.observation_time,
            "maritime_region": inc.maritime_region,
            "distance_to_coast_km": inc.distance_to_coast_km,
            "detection_method": inc.detection_method,
            "satellite_platform": inc.satellite_platform,
            "sensor_type": inc.sensor_type,
            "image_id": inc.image_id,
            "confidence_score": f"{inc.confidence_score * 100:.1f}%",
            "look_alike_probability": f"{inc.look_alike_probability * 100:.1f}%",
            "surface_area_km2": f"{inc.surface_area_km2:.2f} km²",
            "reviewer": inc.reviewer,
            "analyst_notes": inc.notes
        },
        "investigation_ranking": {
            "title": inv.title if inv else "Direct Correlation Investigation",
            "time_window": f"{inv.time_window_start} to {inv.time_window_end}" if inv else "N/A",
            "candidates_evaluated": len(candidates),
            "candidates": candidates
        },
        "trajectory_simulation": {
            "drift_forecast_hours": sim.time_steps_hours if sim else 24,
            "wind_forcing": f"{sim.wind_speed_knots} kt @ {sim.wind_direction_deg}°" if sim else "14 kt @ 230°",
            "ocean_current": f"{sim.current_speed_knots} kt @ {sim.current_direction_deg}°" if sim else "1.2 kt @ 120°",
            "coastal_impact_eta_hours": sim.coastal_arrival_eta_hours if sim else 18.5,
            "affected_coastline_km": sim.affected_coastline_km if sim else 4.8
        },
        "environmental_impact": {
            "closest_sanctuary": "Sisters' Islands Marine Park (8.5 km)",
            "threatened_habitats_count": len([a for a in env_assets if a.exposure_risk in ["High", "Imminent High Risk"]]),
            "recommended_containment_action": "Deploy Class-B protective marine boom at Western channel inlet."
        },
        "legal_and_methodological_disclaimers": [
            "Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility.",
            "Results depend on data availability, model assumptions, and independent verification.",
            "Synthetic Aperture Radar (SAR) dark features may be caused by biogenic natural films, low surface wind (< 3 m/s), or internal waves.",
            "AIS transmission gaps can occur from VHF antenna shading, high traffic message collision, or terrestrial receiver blind spots, and do not constitute proof of deliberate deactivation."
        ]
    }
    return report_dossier

@router.get("/{incident_id}/export/csv")
def export_incident_csv(incident_id: str, db: Session = Depends(get_db)):
    """
    Exports candidates and evidence assessments as CSV.
    """
    inc = db.query(Incident).filter((Incident.id == incident_id) | (Incident.incident_code == incident_id)).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inv = db.query(Investigation).filter(Investigation.incident_id == inc.id).first()
    rows = [
        "Rank,Vessel_Name,MMSI,IMO,Vessel_Type,Flag,Priority_Score,Temporal_Score,Spatial_Score,Route_Score,Speed_Anomaly_Score,AIS_Gap_Score,Status,Legal_Notice"
    ]
    if inv:
        ca_list = db.query(CandidateAssessment).filter(CandidateAssessment.investigation_id == inv.id).order_by(CandidateAssessment.priority_rank.asc()).all()
        for ca in ca_list:
            v = db.query(Vessel).filter(Vessel.id == ca.vessel_id).first()
            row = (
                f"{ca.priority_rank},"
                f"\"{v.name if v else 'Unknown'}\","
                f"{v.mmsi if v else ''},"
                f"{v.imo if v else ''},"
                f"\"{v.vessel_type if v else ''}\","
                f"\"{v.flag if v else ''}\","
                f"{ca.priority_score},"
                f"{ca.temporal_score},"
                f"{ca.spatial_score},"
                f"{ca.route_score},"
                f"{ca.speed_anomaly_score},"
                f"{ca.ais_gap_score},"
                f"\"{ca.review_status}\","
                f"\"PRIORITY INQUIRY ONLY - NOT LEGAL PROOF\""
            )
            rows.append(row)

    csv_data = "\n".join(rows)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=OceanGuard_{inc.incident_code}_candidates.csv"}
    )
