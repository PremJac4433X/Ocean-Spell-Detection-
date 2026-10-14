from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Incident Schemas ---
class IncidentBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    severity: str = "Medium"
    detection_method: str = "Sentinel-1 SAR C-Band"
    satellite_platform: str = "Sentinel-1A"
    sensor_type: str = "C-SAR IW (Interferometric Wide)"
    image_id: str = "S1A_IW_GRDH_1SDV_20261012T024510"
    confidence_score: float = 0.85
    surface_area_km2: float = 4.2
    maritime_region: str = "Malacca Strait"
    distance_to_coast_km: float = 12.5
    notes: Optional[str] = ""

class IncidentCreate(IncidentBase):
    geometry_geojson: Dict[str, Any]
    observation_time: str
    bounding_box: Optional[List[float]] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    reviewer: Optional[str] = None
    notes: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: str
    incident_code: str
    status: str
    observation_time: str
    look_alike_probability: float
    reviewer: str
    geometry_geojson: Any
    bounding_box: Any
    is_demonstration: bool
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True

# --- Vessel Schemas ---
class VesselPositionResponse(BaseModel):
    id: int
    timestamp: str
    latitude: float
    longitude: float
    speed_knots: float
    course_deg: float
    is_interpolated: bool
    ais_gap_flag: bool

    class Config:
        from_attributes = True

class VesselResponse(BaseModel):
    id: str
    mmsi: str
    imo: str
    name: str
    vessel_type: str
    flag: str
    length_m: float
    width_m: float
    draught_m: float
    destination: str
    speed_knots: float
    course_deg: float
    heading_deg: float
    nav_status: str
    last_seen: str
    data_provider: str
    is_demonstration: bool

    class Config:
        from_attributes = True

class VesselDetailResponse(VesselResponse):
    positions: List[VesselPositionResponse] = []

# --- Candidate Assessment Schemas ---
class CandidateAssessmentResponse(BaseModel):
    id: int
    vessel_id: str
    priority_rank: int
    priority_score: float
    temporal_score: float
    spatial_score: float
    route_score: float
    speed_anomaly_score: float
    ais_gap_score: float
    supporting_evidence: List[str]
    contradictory_evidence: List[str]
    missing_evidence: List[str]
    alternative_explanations: List[str]
    verification_steps: List[str]
    review_status: str
    vessel: Optional[VesselResponse] = None

    class Config:
        from_attributes = True

# --- Investigation Schemas ---
class InvestigationCreate(BaseModel):
    incident_id: str
    title: str
    time_window_start: str
    time_window_end: str
    geographic_radius_nm: float = 30.0

class InvestigationResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    time_window_start: str
    time_window_end: str
    geographic_radius_nm: float
    status: str
    created_at: Any
    candidates: List[CandidateAssessmentResponse] = []

    class Config:
        from_attributes = True

# --- Trajectory Simulation Schemas ---
class TrajectoryRequest(BaseModel):
    incident_id: str
    simulation_type: str = "forward_drift"  # forward_drift, backward_backtrack
    time_steps_hours: int = 24
    particle_count: int = 100
    wind_speed_knots: float = 14.5
    wind_direction_deg: float = 230.0
    current_speed_knots: float = 1.3
    current_direction_deg: float = 120.0
    decay_rate_pct_per_day: float = 8.0

class TrajectoryResponse(BaseModel):
    id: str
    incident_id: str
    simulation_type: str
    run_timestamp: str
    time_steps_hours: int
    particle_count: int
    wind_speed_knots: float
    wind_direction_deg: float
    current_speed_knots: float
    current_direction_deg: float
    particles_geojson: Dict[str, Any]
    uncertainty_cone_geojson: Dict[str, Any]
    coastal_arrival_eta_hours: Optional[float]
    affected_coastline_km: float

    class Config:
        from_attributes = True

# --- Satellite Detection Analysis Schemas ---
class DetectionAnalyzeRequest(BaseModel):
    scene_id: Optional[str] = "S1A_IW_GRDH_1SDV_20261012T024510"
    satellite_type: str = "Sentinel-1 SAR C-Band"
    polarization: str = "VV"
    threshold_sensitivity: float = 0.5  # 0.1 to 1.0
    filter_mode: str = "Adaptive Lee + CFAR"
    region_preset: Optional[str] = "malacca_strait"  # malacca_strait, gulf_of_mexico, celtic_sea

class DetectionPolygon(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class DetectionAnalyzeResponse(BaseModel):
    status: str
    detection_id: str
    satellite: str
    acquisition_time: str
    candidates_count: int
    estimated_total_area_km2: float
    mean_confidence: float
    look_alike_probability: float
    look_alike_reason: str
    sar_features: Dict[str, Any]
    geojson_polygons: Dict[str, Any]
    limitations: List[str]
    processing_time_ms: int

# --- Environmental Asset Schemas ---
class EnvironmentalAssetResponse(BaseModel):
    id: str
    name: str
    asset_type: str
    latitude: float
    longitude: float
    geometry_geojson: Any
    vulnerability_index: int
    sensitivity_level: str
    distance_to_spill_km: float
    exposure_risk: str
    description: str

    class Config:
        from_attributes = True

class EnvironmentalRiskSummaryResponse(BaseModel):
    total_protected_areas: int
    critical_exposure_count: int
    closest_habitat_distance_km: float
    closest_habitat_name: str
    vulnerable_assets: List[EnvironmentalAssetResponse]
    coastal_impact_predicted: bool
    suggested_containment_zones: List[str]

# --- Data Source Status Schemas ---
class DataSourceStatusResponse(BaseModel):
    id: str
    provider_name: str
    data_type: str
    last_sync: str
    status: str
    latency_ms: int
    coverage: str
    is_simulated: bool
    records_count: int

    class Config:
        from_attributes = True

# --- Dashboard Summary Schema ---
class DashboardSummaryResponse(BaseModel):
    total_spill_candidates: int
    verified_incidents: int
    unverified_detections: int
    vessels_in_observation_area: int
    vessels_intersecting_corridor: int
    active_investigations: int
    environmental_alerts_active: int
    sensitive_coastal_areas_at_risk: int
    latest_satellite_time: str
    data_freshness_status: str
    detection_confidence_distribution: Dict[str, int]
    investigation_priority_distribution: Dict[str, int]
    spill_area_trend: List[Dict[str, Any]]
    vessel_traffic_trend: List[Dict[str, Any]]
    recent_incidents: List[IncidentResponse]
    system_notice: str

# --- Audit & Report Schemas ---
class ReportDetailResponse(BaseModel):
    report_id: str
    generated_at: str
    incident: IncidentResponse
    investigation: Optional[InvestigationResponse]
    trajectory: Optional[TrajectoryResponse]
    environmental_risk: EnvironmentalRiskSummaryResponse
    methodology: Dict[str, Any]
    legal_disclaimer: str
