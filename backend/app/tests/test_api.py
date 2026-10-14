from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["demo_mode"] is True

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_spill_candidates"] >= 2
    assert data["vessels_in_observation_area"] >= 6
    assert "system_notice" in data

def test_list_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert "incident_code" in data[0]

def test_vessel_tracks():
    response = client.get("/api/vessels/vsl-001/tracks")
    assert response.status_code == 200
    data = response.json()
    assert data["vessel_id"] == "vsl-001"
    assert data["points_count"] >= 5
    assert data["geojson"]["type"] == "Feature"

def test_vessel_ranking_legal_notice():
    response = client.get("/api/incidents/inc-malacca-01/candidates")
    assert response.status_code == 200
    data = response.json()
    assert "legal_notice" in data
    assert "Rankings indicate investigation priority" in data["legal_notice"]
    assert len(data["candidates"]) >= 5

def test_sar_detection_analyze():
    response = client.post("/api/detection/analyze", json={
        "region_preset": "malacca_strait",
        "threshold_sensitivity": 0.5,
        "polarization": "VV"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["estimated_total_area_km2"] > 0
    assert len(data["geojson_polygons"]["features"]) > 0

def test_trajectory_simulation():
    response = client.post("/api/trajectory/simulate", json={
        "incident_id": "inc-malacca-01",
        "simulation_type": "forward_drift",
        "time_steps_hours": 12,
        "particle_count": 50,
        "wind_speed_knots": 15.0,
        "wind_direction_deg": 230.0,
        "current_speed_knots": 1.2,
        "current_direction_deg": 120.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["simulation_type"] == "forward_drift"
    assert len(data["time_steps"]) > 0

def test_live_marine_conditions():
    response = client.get("/api/trajectory/live-marine-conditions?incident_id=inc-malacca-01")
    assert response.status_code == 200
    data = response.json()
    assert "wind_speed_knots" in data
    assert "current_speed_knots" in data
    assert "provider" in data
    assert data["api_key_configured"] is True
    # Security check: Ensure token is never leaked in the JSON response
    from app.config import settings
    token = settings.NOAA_API_KEY or settings.API_KEY
    if token:
        assert token not in response.text

def test_data_sources_live_status():
    response = client.get("/api/data-sources/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    noaa_provider = next((p for p in data["providers"] if "NOAA" in p["provider_name"]), None)
    assert noaa_provider is not None
    assert noaa_provider["status"] in ("Operational", "Degraded")

if __name__ == "__main__":
    print("Running backend tests...")
    test_health_check()
    test_dashboard_summary()
    test_list_incidents()
    test_vessel_tracks()
    test_vessel_ranking_legal_notice()
    test_sar_detection_analyze()
    test_trajectory_simulation()
    test_live_marine_conditions()
    test_data_sources_live_status()
    print("ALL 9 BACKEND TESTS PASSED SUCCESSFULLY!")

