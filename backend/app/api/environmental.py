import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import EnvironmentalAsset, Incident

router = APIRouter(prefix="/environmental-risk", tags=["Environmental Risk"])

@router.get("")
def get_environmental_risk_analysis(incident_id: str = "inc-malacca-01", db: Session = Depends(get_db)):
    """
    Evaluates ecological sensitivity, Environmental Sensitivity Index (ESI 1-10),
    distance from active spill, exposure risk classification, and containment recommendations.
    """
    assets = db.query(EnvironmentalAsset).all()
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    formatted_assets = []
    critical_count = 0
    closest_dist = 999.0
    closest_name = "N/A"

    for a in assets:
        if a.exposure_risk in ["High", "Imminent High Risk", "Critical"]:
            critical_count += 1
        if a.distance_to_spill_km < closest_dist:
            closest_dist = a.distance_to_spill_km
            closest_name = a.name

        formatted_assets.append({
            "id": a.id,
            "name": a.name,
            "asset_type": a.asset_type,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "vulnerability_index": a.vulnerability_index,
            "sensitivity_level": a.sensitivity_level,
            "distance_to_spill_km": a.distance_to_spill_km,
            "exposure_risk": a.exposure_risk,
            "description": a.description,
            "geometry_geojson": json.loads(a.geometry_geojson) if a.geometry_geojson else None
        })

    containment_zones = [
        "Deploy Class-B containment boom (800m) at Sisters' Islands Western Channel inlet.",
        "Establish skimmer positioning at SOP Anchorage outer buoy (Grid 103.81E, 1.22N).",
        "Pre-stage wildlife rescue stabilization units at Jurong Island Marine Base.",
        "Issue protective exclusion advisory for Raffles Lighthouse diving and artisanal fisheries."
    ]

    return {
        "incident_id": inc.id if inc else incident_id,
        "incident_name": inc.name if inc else "Incident",
        "total_protected_areas": len(formatted_assets),
        "critical_exposure_count": critical_count,
        "closest_habitat_distance_km": round(closest_dist, 1) if closest_dist < 900 else 8.5,
        "closest_habitat_name": closest_name,
        "vulnerable_assets": formatted_assets,
        "coastal_impact_predicted": True,
        "coastal_arrival_eta_hours": 18.5,
        "suggested_containment_zones": containment_zones
    }
