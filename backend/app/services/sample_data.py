import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import (
    Incident,
    Vessel,
    VesselPosition,
    Investigation,
    CandidateAssessment,
    TrajectorySimulation,
    EnvironmentalAsset,
    DataSourceStatus,
    AuditLog
)
from app.services.drift_simulator import DriftSimulator
from app.services.sar_detector import SAROilSpillDetector
from app.services.vessel_ranker import VesselRanker

def seed_sample_database(db: Session):
    """
    Seeds database with realistic demonstration scenarios if empty.
    """
    if db.query(Incident).count() > 0:
        return  # Already seeded

    now = datetime.utcnow()
    obs_time_1 = (now - timedelta(hours=3, minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ")
    obs_time_2 = (now - timedelta(hours=14, minutes=45)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Incident 1: Malacca Strait Slick Alpha
    sar_result_1 = SAROilSpillDetector.analyze_scene("malacca_strait", sensitivity=0.5)
    poly_geom_1 = sar_result_1["geojson_polygons"]["features"][0]["geometry"]

    incident_1 = Incident(
        id="inc-malacca-01",
        incident_code="OG-2026-0881",
        name="Malacca Strait TSS Slick Alpha",
        status="Under Review",
        severity="High",
        latitude=1.2580,
        longitude=103.7850,
        bounding_box=json.dumps([103.760, 1.240, 103.810, 1.275]),
        geometry_geojson=json.dumps(poly_geom_1),
        surface_area_km2=4.65,
        detection_method="Sentinel-1 SAR C-Band",
        satellite_platform="Sentinel-1A",
        sensor_type="C-SAR IW (Interferometric Wide)",
        image_id="S1A_IW_GRDH_1SDV_20261012T024510_051280_062E01",
        confidence_score=0.88,
        look_alike_probability=0.12,
        observation_time=obs_time_1,
        maritime_region="Singapore Strait / Malacca Traffic Separation Scheme",
        distance_to_coast_km=11.4,
        reviewer="Cmdr. Evelyn Vance (Chief Maritime Officer)",
        notes="High-confidence dark formation identified in eastbound traffic lane. Backscatter damping 8.4 dB. Drift trajectory heads southeast toward sensitive marine park.",
        is_demonstration=True,
        created_at=now - timedelta(hours=3)
    )

    # 2. Incident 2: Gulf of Mexico Sheen
    sar_result_2 = SAROilSpillDetector.analyze_scene("gulf_of_mexico", sensitivity=0.6)
    poly_geom_2 = sar_result_2["geojson_polygons"]["features"][0]["geometry"]

    incident_2 = Incident(
        id="inc-gom-02",
        incident_code="OG-2026-0882",
        name="Mississippi Canyon Deepwater Sheen",
        status="Unverified",
        severity="Medium",
        latitude=28.7420,
        longitude=-88.3610,
        bounding_box=json.dumps([-88.400, 28.710, -88.320, 28.770]),
        geometry_geojson=json.dumps(poly_geom_2),
        surface_area_km2=7.82,
        detection_method="Sentinel-1 SAR C-Band",
        satellite_platform="Sentinel-1B",
        sensor_type="C-SAR IW (Interferometric Wide)",
        image_id="S1B_IW_GRDH_1SDV_20261010T115200_039200_04A902",
        confidence_score=0.79,
        look_alike_probability=0.28,
        observation_time=obs_time_2,
        maritime_region="Gulf of Mexico (Outer Continental Shelf)",
        distance_to_coast_km=48.0,
        reviewer="Pending Assignment",
        notes="Elongated surface feature detected near active lease block. Potential natural seep or bunker discharge under investigation.",
        is_demonstration=True,
        created_at=now - timedelta(hours=14)
    )

    db.add(incident_1)
    db.add(incident_2)
    db.flush()

    # 3. Vessels and AIS Track histories (Strait of Malacca context)
    vessels_data = [
        {
            "id": "vsl-001",
            "name": "MT Pacific Osprey",
            "mmsi": "563012340",
            "imo": "9481234",
            "vessel_type": "Crude Oil Tanker",
            "flag": "Panama",
            "length_m": 274.0,
            "width_m": 48.0,
            "draught_m": 15.2,
            "destination": "SINGAPORE JURONG",
            "speed_knots": 12.8,
            "course_deg": 118.0,
            "heading_deg": 119.0,
            "nav_status": "Underway using engine",
            "data_provider": "AISHub Global Network (Simulated)",
            # Track history: crosses near slick origin with an AIS blackout gap and speed drop
            "track": [
                {"hours_ago": 7.0, "lat": 1.3400, "lon": 103.5800, "speed": 13.5, "course": 118.0, "gap": False},
                {"hours_ago": 6.0, "lat": 1.3210, "lon": 103.6300, "speed": 13.4, "course": 118.0, "gap": False},
                {"hours_ago": 5.0, "lat": 1.2980, "lon": 103.6900, "speed": 13.0, "course": 119.0, "gap": False},
                {"hours_ago": 4.2, "lat": 1.2820, "lon": 103.7350, "speed": 8.2, "course": 122.0, "gap": True},  # AIS GAP starts, speed drops
                {"hours_ago": 3.4, "lat": 1.2650, "lon": 103.7720, "speed": 7.4, "course": 120.0, "gap": True},  # Near backtracked origin
                {"hours_ago": 2.5, "lat": 1.2480, "lon": 103.8150, "speed": 11.8, "course": 116.0, "gap": False}, # Resumes
                {"hours_ago": 1.5, "lat": 1.2310, "lon": 103.8650, "speed": 12.4, "course": 115.0, "gap": False},
                {"hours_ago": 0.5, "lat": 1.2140, "lon": 103.9180, "speed": 12.8, "course": 115.0, "gap": False},
            ]
        },
        {
            "id": "vsl-002",
            "name": "Nordic Carrier",
            "mmsi": "257098760",
            "imo": "9345678",
            "vessel_type": "Chemical Tanker",
            "flag": "Norway",
            "length_m": 182.0,
            "width_m": 28.0,
            "draught_m": 10.4,
            "destination": "PORT KLANG",
            "speed_knots": 14.1,
            "course_deg": 298.0,
            "heading_deg": 297.0,
            "nav_status": "Underway using engine",
            "data_provider": "AISHub Global Network (Simulated)",
            # Westbound lane (opposite direction), steady speed
            "track": [
                {"hours_ago": 7.0, "lat": 1.1850, "lon": 103.9500, "speed": 14.2, "course": 298.0, "gap": False},
                {"hours_ago": 5.5, "lat": 1.2120, "lon": 103.8800, "speed": 14.0, "course": 297.0, "gap": False},
                {"hours_ago": 4.0, "lat": 1.2380, "lon": 103.8100, "speed": 14.1, "course": 298.0, "gap": False},
                {"hours_ago": 2.5, "lat": 1.2640, "lon": 103.7400, "speed": 14.0, "course": 298.0, "gap": False},
                {"hours_ago": 1.0, "lat": 1.2910, "lon": 103.6700, "speed": 14.1, "course": 297.0, "gap": False},
                {"hours_ago": 0.2, "lat": 1.3150, "lon": 103.6050, "speed": 14.1, "course": 298.0, "gap": False},
            ]
        },
        {
            "id": "vsl-003",
            "name": "Ever Glade",
            "mmsi": "416045670",
            "imo": "9811234",
            "vessel_type": "Container Ship",
            "flag": "Taiwan",
            "length_m": 399.0,
            "width_m": 58.0,
            "draught_m": 16.0,
            "destination": "TANJUNG PELEPAS",
            "speed_knots": 18.2,
            "course_deg": 302.0,
            "heading_deg": 302.0,
            "nav_status": "Underway using engine",
            "data_provider": "AISHub Global Network (Simulated)",
            "track": [
                {"hours_ago": 6.0, "lat": 1.1600, "lon": 104.0100, "speed": 18.5, "course": 302.0, "gap": False},
                {"hours_ago": 4.5, "lat": 1.2050, "lon": 103.9000, "speed": 18.2, "course": 302.0, "gap": False},
                {"hours_ago": 3.0, "lat": 1.2510, "lon": 103.7900, "speed": 18.4, "course": 301.0, "gap": False},
                {"hours_ago": 1.5, "lat": 1.2980, "lon": 103.6800, "speed": 18.0, "course": 302.0, "gap": False},
                {"hours_ago": 0.3, "lat": 1.3390, "lon": 103.5850, "speed": 17.8, "course": 303.0, "gap": False},
            ]
        },
        {
            "id": "vsl-004",
            "name": "Iron Navigator",
            "mmsi": "352012980",
            "imo": "9234567",
            "vessel_type": "Bulk Carrier",
            "flag": "Liberia",
            "length_m": 225.0,
            "width_m": 32.2,
            "draught_m": 12.8,
            "destination": "QINGDAO",
            "speed_knots": 11.2,
            "course_deg": 117.0,
            "heading_deg": 117.0,
            "nav_status": "Underway using engine",
            "data_provider": "AISHub Global Network (Simulated)",
            "track": [
                {"hours_ago": 8.0, "lat": 1.3650, "lon": 103.5200, "speed": 11.5, "course": 117.0, "gap": False},
                {"hours_ago": 6.0, "lat": 1.3280, "lon": 103.6150, "speed": 11.2, "course": 117.0, "gap": False},
                {"hours_ago": 4.0, "lat": 1.2920, "lon": 103.7100, "speed": 11.3, "course": 117.0, "gap": False},
                {"hours_ago": 2.0, "lat": 1.2560, "lon": 103.8050, "speed": 11.1, "course": 117.0, "gap": False},
                {"hours_ago": 0.4, "lat": 1.2260, "lon": 103.8820, "speed": 11.2, "course": 117.0, "gap": False},
            ]
        },
        {
            "id": "vsl-005",
            "name": "Sea Titan",
            "mmsi": "503098120",
            "imo": "9678123",
            "vessel_type": "Tug / Offshore",
            "flag": "Australia",
            "length_m": 65.0,
            "width_m": 16.0,
            "draught_m": 5.2,
            "destination": "SINGAPORE EAST",
            "speed_knots": 6.5,
            "course_deg": 85.0,
            "heading_deg": 86.0,
            "nav_status": "Engaged in towing",
            "data_provider": "AISHub Global Network (Simulated)",
            "track": [
                {"hours_ago": 6.0, "lat": 1.2000, "lon": 103.7100, "speed": 6.2, "course": 85.0, "gap": False},
                {"hours_ago": 4.0, "lat": 1.2050, "lon": 103.7600, "speed": 6.4, "course": 85.0, "gap": False},
                {"hours_ago": 2.0, "lat": 1.2100, "lon": 103.8100, "speed": 6.6, "course": 86.0, "gap": False},
                {"hours_ago": 0.5, "lat": 1.2150, "lon": 103.8500, "speed": 6.5, "course": 85.0, "gap": False},
            ]
        },
        {
            "id": "vsl-006",
            "name": "Harbor Star",
            "mmsi": "563045670",
            "imo": "9123456",
            "vessel_type": "Bunkering Tanker",
            "flag": "Singapore",
            "length_m": 98.0,
            "width_m": 18.0,
            "draught_m": 6.8,
            "destination": "SOP ANCHORAGE",
            "speed_knots": 0.2,
            "course_deg": 0.0,
            "heading_deg": 45.0,
            "nav_status": "At anchor",
            "data_provider": "AISHub Global Network (Simulated)",
            "track": [
                {"hours_ago": 8.0, "lat": 1.2280, "lon": 103.7220, "speed": 0.2, "course": 0.0, "gap": False},
                {"hours_ago": 4.0, "lat": 1.2282, "lon": 103.7218, "speed": 0.1, "course": 0.0, "gap": False},
                {"hours_ago": 0.2, "lat": 1.2280, "lon": 103.7220, "speed": 0.2, "course": 0.0, "gap": False},
            ]
        }
    ]

    for v_data in vessels_data:
        vessel = Vessel(
            id=v_data["id"],
            mmsi=v_data["mmsi"],
            imo=v_data["imo"],
            name=v_data["name"],
            vessel_type=v_data["vessel_type"],
            flag=v_data["flag"],
            length_m=v_data["length_m"],
            width_m=v_data["width_m"],
            draught_m=v_data["draught_m"],
            destination=v_data["destination"],
            speed_knots=v_data["speed_knots"],
            course_deg=v_data["course_deg"],
            heading_deg=v_data["heading_deg"],
            nav_status=v_data["nav_status"],
            last_seen=(now - timedelta(hours=v_data["track"][-1]["hours_ago"])).strftime("%Y-%m-%dT%H:%M:%SZ"),
            data_provider=v_data["data_provider"],
            is_demonstration=True
        )
        db.add(vessel)
        db.flush()

        for pt in v_data["track"]:
            pos_time = (now - timedelta(hours=pt["hours_ago"])).strftime("%Y-%m-%dT%H:%M:%SZ")
            vp = VesselPosition(
                vessel_id=vessel.id,
                timestamp=pos_time,
                latitude=pt["lat"],
                longitude=pt["lon"],
                speed_knots=pt["speed"],
                course_deg=pt["course"],
                is_interpolated=False,
                ais_gap_flag=pt["gap"]
            )
            db.add(vp)

    db.flush()

    # 4. Trajectory Simulation for Incident 1 (Forward + Backward)
    fwd_sim = DriftSimulator.run_forward_simulation(
        origin_lat=1.2580,
        origin_lon=103.7850,
        hours=24,
        particle_count=80,
        wind_speed_knots=14.0,
        wind_dir_deg=230.0,
        current_speed_knots=1.2,
        current_dir_deg=120.0
    )

    traj_sim_1 = TrajectorySimulation(
        id="traj-sim-01",
        incident_id=incident_1.id,
        simulation_type="forward_drift",
        run_timestamp=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        time_steps_hours=24,
        particle_count=80,
        wind_speed_knots=14.0,
        wind_direction_deg=230.0,
        current_speed_knots=1.2,
        current_direction_deg=120.0,
        decay_rate_pct_per_day=8.5,
        particles_geojson=json.dumps(fwd_sim["time_steps"]),
        uncertainty_cone_geojson=json.dumps(fwd_sim["uncertainty_cone_geojson"]),
        coastal_arrival_eta_hours=18.5,
        affected_coastline_km=4.8
    )
    db.add(traj_sim_1)

    # 5. Investigation and Multi-Factor Vessel Ranking for Incident 1
    backtrack = DriftSimulator.run_backward_backtrack(
        observed_lat=1.2580,
        observed_lon=103.7850,
        hours_back=8,
        wind_speed_knots=14.0,
        wind_dir_deg=230.0,
        current_speed_knots=1.2,
        current_dir_deg=120.0
    )

    investigation_1 = Investigation(
        id="inv-malacca-01",
        incident_id=incident_1.id,
        title="Malacca TSS AIS Correlation & Source Attribution Inquiry",
        time_window_start=(now - timedelta(hours=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        time_window_end=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        geographic_radius_nm=25.0,
        status="Analysis In Progress",
        created_at=now - timedelta(hours=2)
    )
    db.add(investigation_1)
    db.flush()

    # Rank all 6 vessels against the incident
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
            spill_lat=incident_1.latitude,
            spill_lon=incident_1.longitude,
            backtrack_points=backtrack["backtrack_points"]
        )
        evaluations.append(eval_res)

    # Sort descending by priority_score
    evaluations.sort(key=lambda x: x["priority_score"], reverse=True)

    for rank_idx, ev in enumerate(evaluations, 1):
        ca = CandidateAssessment(
            investigation_id=investigation_1.id,
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

    # 6. Environmental Assets / Protected Areas
    env_assets = [
        {
            "id": "env-001",
            "name": "Pulau Satumu Coral Reserve & Lighthouse Sanctuary",
            "asset_type": "Coral Reef System",
            "lat": 1.1610,
            "lon": 103.7420,
            "vulnerability": 9,
            "sensitivity": "Critical",
            "distance": 12.3,
            "risk": "Potential",
            "description": "Fringing coral reef supporting endangered hawksbill turtle nesting and hard coral diversity."
        },
        {
            "id": "env-002",
            "name": "Sisters' Islands Marine Park",
            "asset_type": "Marine Protected Area",
            "lat": 1.2150,
            "lon": 103.8340,
            "vulnerability": 8,
            "sensitivity": "High",
            "distance": 8.5,
            "risk": "Imminent High Risk",
            "description": "Singapore's premier 40-hectare marine sanctuary housing 250 species of hard corals and seagrass meadows."
        },
        {
            "id": "env-003",
            "name": "Tanjung Piai Coastal Mangrove Ramsar Reserve",
            "asset_type": "Mangrove Wetland",
            "lat": 1.2650,
            "lon": 103.5100,
            "vulnerability": 10,
            "sensitivity": "Critical",
            "distance": 30.8,
            "risk": "Unlikely",
            "description": "Southernmost tip of mainland Asia; crucial tidal mudflat habitat for migratory shorebirds."
        },
        {
            "id": "env-004",
            "name": "Raffles Lighthouse Biogenic Coral Shelf",
            "asset_type": "Fishery & Nursery",
            "lat": 1.1600,
            "lon": 103.7400,
            "vulnerability": 8,
            "sensitivity": "High",
            "distance": 12.5,
            "risk": "Potential",
            "description": "Spawning ground for commercial pelagic fish species and benthic invertebrates."
        }
    ]

    for ea in env_assets:
        # Generate simple bounding box polygon GeoJSON for visualization
        delta = 0.015
        poly_coords = [
            [ea["lon"] - delta, ea["lat"] - delta],
            [ea["lon"] + delta, ea["lat"] - delta],
            [ea["lon"] + delta, ea["lat"] + delta],
            [ea["lon"] - delta, ea["lat"] + delta],
            [ea["lon"] - delta, ea["lat"] - delta]
        ]
        asset_obj = EnvironmentalAsset(
            id=ea["id"],
            name=ea["name"],
            asset_type=ea["asset_type"],
            latitude=ea["lat"],
            longitude=ea["lon"],
            geometry_geojson=json.dumps({"type": "Polygon", "coordinates": [poly_coords]}),
            vulnerability_index=ea["vulnerability"],
            sensitivity_level=ea["sensitivity"],
            distance_to_spill_km=ea["distance"],
            exposure_risk=ea["risk"],
            description=ea["description"]
        )
        db.add(asset_obj)

    # 7. Data Sources Status
    data_sources = [
        {
            "id": "ds-001",
            "provider_name": "Copernicus Data Space Ecosystem (ESA)",
            "data_type": "Sentinel-1 SAR C-Band & Sentinel-2 MSI",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "Operational",
            "latency_ms": 142,
            "coverage": "Global Ocean EEZ & Maritime Corridors",
            "is_simulated": False,
            "records_count": 28410
        },
        {
            "id": "ds-002",
            "provider_name": "AISHub Global Terrestrial & Satellite Network",
            "data_type": "Real-Time & Historical AIS Telemetry",
            "last_sync": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "Operational",
            "latency_ms": 86,
            "coverage": "Global Shipping Corridors & Straits",
            "is_simulated": True,
            "records_count": 142850
        },
        {
            "id": "ds-003",
            "provider_name": "NOAA HYCOM / GFS Global Marine Forecast",
            "data_type": "Surface Ocean Currents & Wind Vectors",
            "last_sync": (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "Operational",
            "latency_ms": 210,
            "coverage": "Global 0.08° Ocean Circulation Grid",
            "is_simulated": False,
            "records_count": 48200
        },
        {
            "id": "ds-004",
            "provider_name": "UNEP-WCMC / WDPA Marine Protected Areas",
            "data_type": "Global Protected Planet Polygon Geodatabase",
            "last_sync": (now - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "Operational",
            "latency_ms": 320,
            "coverage": "Worldwide Marine Protected Zones",
            "is_simulated": False,
            "records_count": 18450
        }
    ]

    for ds in data_sources:
        dso = DataSourceStatus(
            id=ds["id"],
            provider_name=ds["provider_name"],
            data_type=ds["data_type"],
            last_sync=ds["last_sync"],
            status=ds["status"],
            latency_ms=ds["latency_ms"],
            coverage=ds["coverage"],
            is_simulated=ds["is_simulated"],
            records_count=ds["records_count"]
        )
        db.add(dso)

    # 8. Audit Logs
    audit_entries = [
        {
            "time": (now - timedelta(hours=3, minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": "AUTOMATED_SAR_DETECTION",
            "target_type": "Incident",
            "target_id": "OG-2026-0881",
            "details": "Adaptive CFAR pipeline identified 4.65 km² dark formation on Sentinel-1A pass. Confidence 88%."
        },
        {
            "time": (now - timedelta(hours=2, minutes=50)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": "INVESTIGATION_INITIALIZED",
            "target_type": "Investigation",
            "target_id": "inv-malacca-01",
            "details": "Corridor window set to 10 hours prior. 6 AIS candidate tracks ingested."
        },
        {
            "time": (now - timedelta(hours=2, minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": "PRIORITY_RANKING_CALCULATED",
            "target_type": "CandidateAssessment",
            "target_id": "vsl-001",
            "details": "MT Pacific Osprey flagged for Priority Inquiry (Score 82.4) based on CPA 1.4 km and speed drop."
        },
        {
            "time": (now - timedelta(hours=1, minutes=45)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "action": "TRAJECTORY_SIMULATION_RUN",
            "target_type": "TrajectorySimulation",
            "target_id": "traj-sim-01",
            "details": "Forward 24h drift executed. Sisters' Islands Marine Park flagged for potential coastal exposure ETA 18.5h."
        }
    ]

    for ae in audit_entries:
        al = AuditLog(
            timestamp=ae["time"],
            action=ae["action"],
            user_role="System Automated / Maritime Intelligence",
            target_type=ae["target_type"],
            target_id=ae["target_id"],
            details=ae["details"]
        )
        db.add(al)

    db.commit()
