export interface Incident {
  id: string;
  incident_code: string;
  name: string;
  status: 'Unverified' | 'Under Review' | 'Verified' | 'Response Active' | 'Contained' | 'Closed';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  latitude: number;
  longitude: number;
  surface_area_km2: number;
  detection_method: string;
  satellite_platform: string;
  sensor_type: string;
  image_id: string;
  confidence_score: number;
  look_alike_probability: number;
  observation_time: string;
  maritime_region: string;
  distance_to_coast_km: number;
  reviewer: string;
  notes: string;
  geometry_geojson: any;
  bounding_box: number[] | null;
  is_demonstration: boolean;
  created_at: string;
  updated_at: string;
}

export interface VesselPosition {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_knots: number;
  course_deg: number;
  is_interpolated: boolean;
  ais_gap_flag: boolean;
}

export interface Vessel {
  id: string;
  mmsi: string;
  imo: string;
  name: string;
  vessel_type: string;
  flag: string;
  length_m: number;
  width_m: number;
  draught_m: number;
  destination: string;
  speed_knots: number;
  course_deg: number;
  heading_deg: number;
  nav_status: string;
  last_seen: string;
  data_provider: string;
  is_demonstration: boolean;
}

export interface CandidateAssessment {
  id: number;
  vessel_id: string;
  vessel?: Vessel;
  priority_rank: number;
  priority_score: number;
  temporal_score: number;
  spatial_score: number;
  route_score: number;
  speed_anomaly_score: number;
  ais_gap_score: number;
  supporting_evidence: string[];
  contradictory_evidence: string[];
  missing_evidence: string[];
  alternative_explanations: string[];
  verification_steps: string[];
  review_status: string;
}

export interface Investigation {
  id: string;
  incident_id: string;
  title: string;
  time_window_start: string;
  time_window_end: string;
  geographic_radius_nm: number;
  status: string;
  created_at: string;
  candidates_count?: number;
  candidates?: CandidateAssessment[];
  legal_notice?: string;
}

export interface TrajectoryParticle {
  id: number;
  lat: number;
  lon: number;
  mass_pct: number;
}

export interface TrajectoryTimeStep {
  elapsed_hours: number;
  particle_count: number;
  mean_lat: number;
  mean_lon: number;
  spread_radius_km: number;
  particles: TrajectoryParticle[];
}

export interface TrajectorySimulationResult {
  id: string;
  incident_id: string;
  simulation_type: 'forward_drift' | 'backward_backtrack';
  run_timestamp: string;
  time_steps_hours: number;
  particle_count: number;
  drift_parameters?: {
    wind_speed_knots: number;
    wind_dir_deg: number;
    current_speed_knots: number;
    current_dir_deg: number;
    net_drift_speed_knots: number;
    net_drift_bearing_deg: number;
  };
  time_steps?: TrajectoryTimeStep[];
  uncertainty_cone_geojson?: any;
  origin_corridor_geojson?: any;
  coastal_arrival_eta_hours?: number | null;
  affected_coastline_km?: number;
  backtrack_points?: Array<{
    hours_prior: number;
    latitude: number;
    longitude: number;
    uncertainty_radius_km: number;
  }>;
  most_probable_release_window?: string;
}

export interface EnvironmentalAsset {
  id: string;
  name: string;
  asset_type: string;
  latitude: number;
  longitude: number;
  geometry_geojson: any;
  vulnerability_index: number;
  sensitivity_level: string;
  distance_to_spill_km: number;
  exposure_risk: 'Unlikely' | 'Potential' | 'Imminent High Risk';
  description: string;
}

export interface DataSourceStatus {
  id: string;
  provider_name: string;
  data_type: string;
  last_sync: string;
  status: 'Operational' | 'Degraded' | 'Simulated/Cached' | 'Offline';
  latency_ms: number;
  coverage: string;
  is_simulated: boolean;
  records_count: number;
}

export interface LiveMarineConditions {
  provider: string;
  provider_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  api_key_configured: boolean;
  status: 'operational' | 'auth_error' | 'rate_limited' | 'timeout' | 'network_error';
  source: string;
  wind_speed_knots: number;
  wind_direction_deg: number;
  current_speed_knots: number;
  current_direction_deg: number;
  wave_height_m?: number;
  latency_ms: number;
  is_live: boolean;
  error?: string | null;
}

export interface DashboardSummary {
  total_spill_candidates: number;
  verified_incidents: number;
  unverified_detections: number;
  vessels_in_observation_area: number;
  vessels_intersecting_corridor: number;
  active_investigations: number;
  environmental_alerts_active: number;
  sensitive_coastal_areas_at_risk: number;
  latest_satellite_time: string;
  data_freshness_status: string;
  detection_confidence_distribution: Record<string, number>;
  investigation_priority_distribution: Record<string, number>;
  spill_area_trend: Array<{ day: string; area_km2: number; detections: number }>;
  vessel_traffic_trend: Array<{ hour: string; tankers: number; cargo: number; other: number }>;
  recent_incidents: Incident[];
  system_notice: string;
}

export type PageId =
  | 'overview'
  | 'ocean-map'
  | 'spill-detection'
  | 'vessel-intelligence'
  | 'route-investigation'
  | 'vessel-ranking'
  | 'trajectory-prediction'
  | 'environmental-impact'
  | 'incident-management'
  | 'ai-analytics'
  | 'reports-exports'
  | 'data-sources'
  | 'settings';
