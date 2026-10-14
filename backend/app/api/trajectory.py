import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Incident, TrajectorySimulation
from app.schemas.schemas import TrajectoryRequest, TrajectoryResponse
from typing import Optional
from app.services.drift_simulator import DriftSimulator
from app.services.noaa_service import NOAAMarineService

router = APIRouter(prefix="/trajectory", tags=["Trajectory"])

@router.post("/simulate")
def run_trajectory_simulation(req: TrajectoryRequest, db: Session = Depends(get_db)):
    """
    Executes Lagrangian particle drift simulation (Forward) or Backtracking (Backward).
    Calculates particle advection, turbulent diffusion, decay, uncertainty corridor polygon,
    and estimated coastal arrival window.
    """
    inc = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_id = f"traj-{uuid.uuid4().hex[:8]}"
    now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    if req.simulation_type == "backward_backtrack":
        res = DriftSimulator.run_backward_backtrack(
            observed_lat=inc.latitude,
            observed_lon=inc.longitude,
            hours_back=req.time_steps_hours,
            wind_speed_knots=req.wind_speed_knots,
            wind_dir_deg=req.wind_direction_deg,
            current_speed_knots=req.current_speed_knots,
            current_dir_deg=req.current_direction_deg
        )
        return {
            "id": sim_id,
            "incident_id": inc.id,
            "simulation_type": "backward_backtrack",
            "run_timestamp": now_str,
            "time_steps_hours": req.time_steps_hours,
            "backtrack_points": res["backtrack_points"],
            "origin_corridor_geojson": res["origin_corridor_geojson"],
            "most_probable_release_window": res["most_probable_release_window"]
        }
    else:
        # Forward drift simulation
        res = DriftSimulator.run_forward_simulation(
            origin_lat=inc.latitude,
            origin_lon=inc.longitude,
            hours=req.time_steps_hours,
            particle_count=req.particle_count,
            wind_speed_knots=req.wind_speed_knots,
            wind_dir_deg=req.wind_direction_deg,
            current_speed_knots=req.current_speed_knots,
            current_dir_deg=req.current_direction_deg,
            decay_rate_pct_day=req.decay_rate_pct_per_day
        )

        sim_record = TrajectorySimulation(
            id=sim_id,
            incident_id=inc.id,
            simulation_type="forward_drift",
            run_timestamp=now_str,
            time_steps_hours=req.time_steps_hours,
            particle_count=req.particle_count,
            wind_speed_knots=req.wind_speed_knots,
            wind_direction_deg=req.wind_direction_deg,
            current_speed_knots=req.current_speed_knots,
            current_direction_deg=req.current_direction_deg,
            decay_rate_pct_per_day=req.decay_rate_pct_per_day,
            particles_geojson=json.dumps(res["time_steps"]),
            uncertainty_cone_geojson=json.dumps(res["uncertainty_cone_geojson"]),
            coastal_arrival_eta_hours=res["coastal_arrival_eta_hours"],
            affected_coastline_km=res["affected_coastline_km"]
        )
        db.add(sim_record)
        db.commit()

        return {
            "id": sim_id,
            "incident_id": inc.id,
            "simulation_type": "forward_drift",
            "run_timestamp": now_str,
            "time_steps_hours": req.time_steps_hours,
            "particle_count": req.particle_count,
            "drift_parameters": res["drift_parameters"],
            "time_steps": res["time_steps"],
            "uncertainty_cone_geojson": res["uncertainty_cone_geojson"],
            "coastal_arrival_eta_hours": res["coastal_arrival_eta_hours"],
            "affected_coastline_km": res["affected_coastline_km"]
        }

@router.get("/latest/{incident_id}")
def get_latest_simulation(incident_id: str, db: Session = Depends(get_db)):
    sim = (
        db.query(TrajectorySimulation)
        .filter(TrajectorySimulation.incident_id == incident_id)
        .order_by(TrajectorySimulation.run_timestamp.desc())
        .first()
    )
    if not sim:
        raise HTTPException(status_code=404, detail="No simulation found for this incident")

    return {
        "id": sim.id,
        "incident_id": sim.incident_id,
        "simulation_type": sim.simulation_type,
        "run_timestamp": sim.run_timestamp,
        "time_steps_hours": sim.time_steps_hours,
        "particle_count": sim.particle_count,
        "wind_speed_knots": sim.wind_speed_knots,
        "wind_direction_deg": sim.wind_direction_deg,
        "current_speed_knots": sim.current_speed_knots,
        "current_direction_deg": sim.current_direction_deg,
        "time_steps": json.loads(sim.particles_geojson) if sim.particles_geojson else [],
        "uncertainty_cone_geojson": json.loads(sim.uncertainty_cone_geojson) if sim.uncertainty_cone_geojson else {},
        "coastal_arrival_eta_hours": sim.coastal_arrival_eta_hours,
        "affected_coastline_km": sim.affected_coastline_km
    }

@router.get("/live-marine-conditions")
def get_live_marine_conditions(
    incident_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Secure server-side endpoint fetching real-time NOAA GFS and HYCOM marine conditions.
    Credentials (NOAA_API_KEY / API_KEY) remain strictly on the backend.
    """
    lat = 1.2580
    lon = 103.7850

    if incident_id:
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if inc:
            lat = inc.latitude
            lon = inc.longitude
    elif latitude is not None and longitude is not None:
        lat = latitude
        lon = longitude

    conditions = NOAAMarineService.fetch_live_marine_vectors(latitude=lat, longitude=lon)
    return conditions
