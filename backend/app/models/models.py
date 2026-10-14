import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    status = Column(String(50), default="Unverified", index=True)  # Unverified, Under Review, Verified, Response Active, Contained, Closed
    severity = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bounding_box = Column(Text, nullable=True)  # JSON string [min_lon, min_lat, max_lon, max_lat]
    geometry_geojson = Column(Text, nullable=False)  # GeoJSON Feature / Polygon string
    surface_area_km2 = Column(Float, default=0.0)
    detection_method = Column(String(100), default="Sentinel-1 SAR C-Band")
    satellite_platform = Column(String(100), default="Sentinel-1A")
    sensor_type = Column(String(100), default="C-SAR IW (Interferometric Wide)")
    image_id = Column(String(100), default="S1A_IW_GRDH_1SDV_20261012T024510")
    confidence_score = Column(Float, default=0.85)  # 0.0 - 1.0
    look_alike_probability = Column(Float, default=0.15)  # Biogenic film / low-wind look-alike risk
    observation_time = Column(String(50), nullable=False)
    maritime_region = Column(String(100), default="Malacca Strait")
    distance_to_coast_km = Column(Float, default=12.5)
    reviewer = Column(String(100), default="Pending Review")
    notes = Column(Text, default="")
    is_demonstration = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    investigations = relationship("Investigation", back_populates="incident", cascade="all, delete-orphan")
    simulations = relationship("TrajectorySimulation", back_populates="incident", cascade="all, delete-orphan")


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(String(50), primary_key=True, index=True)
    mmsi = Column(String(20), unique=True, index=True)
    imo = Column(String(20), index=True)
    name = Column(String(150), nullable=False, index=True)
    vessel_type = Column(String(100), default="Crude Oil Tanker")
    flag = Column(String(50), default="Panama")
    length_m = Column(Float, default=250.0)
    width_m = Column(Float, default=44.0)
    draught_m = Column(Float, default=14.5)
    destination = Column(String(100), default="SINGAPORE")
    speed_knots = Column(Float, default=12.4)
    course_deg = Column(Float, default=115.0)
    heading_deg = Column(Float, default=116.0)
    nav_status = Column(String(100), default="Underway using engine")
    last_seen = Column(String(50), nullable=False)
    data_provider = Column(String(100), default="AISHub Global Feed (Simulated)")
    is_demonstration = Column(Boolean, default=True)

    # Relationships
    positions = relationship("VesselPosition", back_populates="vessel", cascade="all, delete-orphan")


class VesselPosition(Base):
    __tablename__ = "vessel_positions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(String(50), ForeignKey("vessels.id"), index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_knots = Column(Float, default=12.0)
    course_deg = Column(Float, default=0.0)
    is_interpolated = Column(Boolean, default=False)
    ais_gap_flag = Column(Boolean, default=False)

    vessel = relationship("Vessel", back_populates="positions")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), index=True)
    title = Column(String(200), nullable=False)
    time_window_start = Column(String(50), nullable=False)
    time_window_end = Column(String(50), nullable=False)
    geographic_radius_nm = Column(Float, default=25.0)
    status = Column(String(50), default="Analysis In Progress")
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="investigations")
    candidates = relationship("CandidateAssessment", back_populates="investigation", cascade="all, delete-orphan")


class CandidateAssessment(Base):
    __tablename__ = "candidate_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(String(50), ForeignKey("investigations.id"), index=True)
    vessel_id = Column(String(50), ForeignKey("vessels.id"), index=True)
    priority_rank = Column(Integer, default=1)
    priority_score = Column(Float, default=0.0)  # 0 - 100
    temporal_score = Column(Float, default=0.0)
    spatial_score = Column(Float, default=0.0)
    route_score = Column(Float, default=0.0)
    speed_anomaly_score = Column(Float, default=0.0)
    ais_gap_score = Column(Float, default=0.0)
    supporting_evidence = Column(Text, default="[]")  # JSON list
    contradictory_evidence = Column(Text, default="[]")  # JSON list
    missing_evidence = Column(Text, default="[]")  # JSON list
    alternative_explanations = Column(Text, default="[]")  # JSON list
    verification_steps = Column(Text, default="[]")  # JSON list
    review_status = Column(String(50), default="Under Investigation")

    investigation = relationship("Investigation", back_populates="candidates")
    vessel = relationship("Vessel")


class TrajectorySimulation(Base):
    __tablename__ = "trajectory_simulations"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), index=True)
    simulation_type = Column(String(50), default="forward_drift")  # forward_drift, backward_backtrack
    run_timestamp = Column(String(50), nullable=False)
    time_steps_hours = Column(Integer, default=24)
    particle_count = Column(Integer, default=120)
    wind_speed_knots = Column(Float, default=15.0)
    wind_direction_deg = Column(Float, default=240.0)
    current_speed_knots = Column(Float, default=1.2)
    current_direction_deg = Column(Float, default=130.0)
    decay_rate_pct_per_day = Column(Float, default=8.5)
    particles_geojson = Column(Text, nullable=False)  # JSON FeatureCollection with timestamps
    uncertainty_cone_geojson = Column(Text, nullable=False)  # JSON Polygon of corridor
    coastal_arrival_eta_hours = Column(Float, nullable=True)
    affected_coastline_km = Column(Float, default=0.0)

    incident = relationship("Incident", back_populates="simulations")


class EnvironmentalAsset(Base):
    __tablename__ = "environmental_assets"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    asset_type = Column(String(100), default="Marine Protected Area")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=False)
    vulnerability_index = Column(Integer, default=8)  # ESI 1-10
    sensitivity_level = Column(String(50), default="High")  # Low, Moderate, High, Critical
    distance_to_spill_km = Column(Float, default=15.0)
    exposure_risk = Column(String(50), default="Potential")  # Unlikely, Potential, Imminent High Risk
    description = Column(Text, default="")


class DataSourceStatus(Base):
    __tablename__ = "data_source_status"

    id = Column(String(50), primary_key=True, index=True)
    provider_name = Column(String(150), nullable=False)
    data_type = Column(String(100), nullable=False)
    last_sync = Column(String(50), nullable=False)
    status = Column(String(50), default="Operational")  # Operational, Degraded, Simulated/Cached, Offline
    latency_ms = Column(Integer, default=180)
    coverage = Column(String(100), default="Global Marine Zones")
    is_simulated = Column(Boolean, default=True)
    records_count = Column(Integer, default=15420)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    user_role = Column(String(50), default="Senior Maritime Analyst")
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    details = Column(Text, default="")
