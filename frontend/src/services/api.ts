import {
  DashboardSummary,
  Incident,
  Vessel,
  CandidateAssessment,
  Investigation,
  TrajectorySimulationResult,
  EnvironmentalAsset,
  DataSourceStatus,
  LiveMarineConditions
} from '../types';

const API_BASE = '/api';

export const api = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getIncidents(status?: string, severity?: string): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update incident');
    return res.json();
  },

  async getIncidentCandidates(id: string): Promise<{
    incident_id: string;
    incident_code: string;
    legal_notice: string;
    candidates: CandidateAssessment[];
  }> {
    const res = await fetch(`${API_BASE}/incidents/${id}/candidates`);
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  async getVessels(query?: string, vesselType?: string): Promise<Vessel[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (vesselType) params.append('vessel_type', vesselType);
    const res = await fetch(`${API_BASE}/vessels?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch vessels');
    return res.json();
  },

  async getVesselTracks(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/vessels/${id}/tracks`);
    if (!res.ok) throw new Error('Failed to fetch vessel tracks');
    return res.json();
  },

  async analyzeSatelliteScene(preset: string, sensitivity: number, polarization: string): Promise<any> {
    const res = await fetch(`${API_BASE}/detection/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region_preset: preset,
        threshold_sensitivity: sensitivity,
        polarization,
      }),
    });
    if (!res.ok) throw new Error('Failed to analyze SAR scene');
    return res.json();
  },

  async getInvestigations(): Promise<Investigation[]> {
    const res = await fetch(`${API_BASE}/investigations`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  async getInvestigation(id: string): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch investigation');
    return res.json();
  },

  async rankInvestigationVessels(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/investigations/${id}/rank-vessels`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to rank vessels');
    return res.json();
  },

  async runTrajectorySimulation(params: {
    incident_id: string;
    simulation_type: 'forward_drift' | 'backward_backtrack';
    time_steps_hours: number;
    particle_count: number;
    wind_speed_knots: number;
    wind_direction_deg: number;
    current_speed_knots: number;
    current_direction_deg: number;
  }): Promise<TrajectorySimulationResult> {
    const res = await fetch(`${API_BASE}/trajectory/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to simulate trajectory');
    return res.json();
  },

  async getLatestSimulation(incidentId: string): Promise<TrajectorySimulationResult> {
    const res = await fetch(`${API_BASE}/trajectory/latest/${incidentId}`);
    if (!res.ok) throw new Error('Failed to get latest simulation');
    return res.json();
  },

  async getEnvironmentalRisk(incidentId?: string): Promise<{
    incident_id: string;
    incident_name: string;
    total_protected_areas: number;
    critical_exposure_count: number;
    closest_habitat_distance_km: number;
    closest_habitat_name: string;
    vulnerable_assets: EnvironmentalAsset[];
    coastal_impact_predicted: boolean;
    coastal_arrival_eta_hours: number;
    suggested_containment_zones: string[];
  }> {
    const url = incidentId
      ? `${API_BASE}/environmental-risk?incident_id=${incidentId}`
      : `${API_BASE}/environmental-risk`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch environmental risk');
    return res.json();
  },

  async getDataSourcesStatus(): Promise<{
    status: string;
    total_providers: number;
    all_operational: boolean;
    providers: DataSourceStatus[];
  }> {
    const res = await fetch(`${API_BASE}/data-sources/status`);
    if (!res.ok) throw new Error('Failed to fetch data sources');
    return res.json();
  },

  async getIncidentReport(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${incidentId}`);
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  async getLiveMarineConditions(incidentId?: string, lat?: number, lon?: number): Promise<LiveMarineConditions> {
    const params = new URLSearchParams();
    if (incidentId) params.append('incident_id', incidentId);
    if (lat !== undefined) params.append('latitude', lat.toString());
    if (lon !== undefined) params.append('longitude', lon.toString());
    const res = await fetch(`${API_BASE}/trajectory/live-marine-conditions?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch live NOAA marine conditions');
    }
    return res.json();
  },
};
