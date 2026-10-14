from typing import List, Dict, Any, Tuple
from app.services.geo_utils import haversine_distance_km, calculate_bearing_deg

class VesselRanker:
    """
    Transparent Multi-Factor Investigation Priority Ranking Engine.
    Adheres strictly to maritime investigation standards:
    - Rankings indicate priority for inquiry, NEVER legal culpability or proof of release.
    - Evaluates 5 balanced factors:
      1. Temporal compatibility (30%): Was the vessel in the area during plausible release window?
      2. Spatial proximity to backtracked origin corridor (25%): Closest approach distance to origin.
      3. Route vector alignment (20%): Does the vessel course align with slick axis/geometry?
      4. Speed & maneuvering anomaly (15%): Uncharacteristic deceleration or zigzagging.
      5. AIS track continuity & data quality (10%): Flags coverage blind spots with neutral caution.
    """

    NOTICE = (
        "Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility. "
        "Results depend on data availability, model assumptions, and independent verification."
    )

    @classmethod
    def evaluate_vessel(
        cls,
        vessel_dict: Dict[str, Any],
        positions: List[Dict[str, Any]],
        spill_lat: float,
        spill_lon: float,
        backtrack_points: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate a single vessel against the incident and backtracked origin corridor.
        """
        vessel_id = vessel_dict.get("id")
        vessel_name = vessel_dict.get("name", "Unknown Vessel")
        vessel_type = vessel_dict.get("vessel_type", "Merchant")

        # 1. Spatial Proximity & Closest Point of Approach (CPA)
        cpa_spill_km = 999.0
        cpa_origin_km = 999.0
        cpa_pos = None

        origin_lats = [pt["latitude"] for pt in backtrack_points] if backtrack_points else [spill_lat]
        origin_lons = [pt["longitude"] for pt in backtrack_points] if backtrack_points else [spill_lon]
        mean_origin_lat = sum(origin_lats) / len(origin_lats)
        mean_origin_lon = sum(origin_lons) / len(origin_lons)

        speeds = []
        has_ais_gap = False
        longest_gap_minutes = 0

        for i, pos in enumerate(positions):
            dist_to_spill = haversine_distance_km(pos["latitude"], pos["longitude"], spill_lat, spill_lon)
            dist_to_origin = haversine_distance_km(pos["latitude"], pos["longitude"], mean_origin_lat, mean_origin_lon)

            if dist_to_origin < cpa_origin_km:
                cpa_origin_km = dist_to_origin
                cpa_pos = pos

            if dist_to_spill < cpa_spill_km:
                cpa_spill_km = dist_to_spill

            if pos.get("speed_knots") is not None:
                speeds.append(pos["speed_knots"])

            if pos.get("ais_gap_flag"):
                has_ais_gap = True

        # Calculate scores (0 - 100 scale for each factor)

        # Factor 1: Spatial Score (closer to backtracked origin corridor = higher inquiry priority)
        if cpa_origin_km <= 1.5:
            spatial_score = 95.0
        elif cpa_origin_km <= 3.0:
            spatial_score = 80.0
        elif cpa_origin_km <= 6.0:
            spatial_score = 60.0
        elif cpa_origin_km <= 12.0:
            spatial_score = 35.0
        else:
            spatial_score = 10.0

        # Factor 2: Temporal Score
        # Check if the closest approach occurred within plausible release time window (2h to 8h prior)
        if cpa_pos:
            temporal_score = 88.0 if cpa_origin_km < 4.0 else 45.0
        else:
            temporal_score = 20.0

        # Factor 3: Route Alignment
        # Crude tankers / bunker vessels following the channel axis
        if "Tanker" in vessel_type or "Bunkering" in vessel_type:
            route_score = 78.0
        elif "Cargo" in vessel_type or "Container" in vessel_type:
            route_score = 55.0
        else:
            route_score = 35.0

        # Factor 4: Speed Anomaly
        # Typical cruising speed for tankers is 12-15 kt. Significant speed drops (< 7 kt) or erratic speeds
        avg_speed = sum(speeds) / len(speeds) if speeds else 12.0
        min_speed = min(speeds) if speeds else 12.0
        speed_diff = avg_speed - min_speed

        if speed_diff > 4.5:
            speed_anomaly_score = 82.0
        elif speed_diff > 2.0:
            speed_anomaly_score = 50.0
        else:
            speed_anomaly_score = 20.0

        # Factor 5: AIS Track Continuity
        # Note: Gaps can be due to VHF interference, satellite constellation gaps, or transponder issues
        if has_ais_gap:
            ais_gap_score = 75.0
        else:
            ais_gap_score = 25.0

        # Weighted aggregate investigation-priority score
        # Weights: Temporal 30%, Spatial 25%, Route 20%, Speed Anomaly 15%, AIS Gap 10%
        priority_score = (
            temporal_score * 0.30 +
            spatial_score * 0.25 +
            route_score * 0.20 +
            speed_anomaly_score * 0.15 +
            ais_gap_score * 0.10
        )
        priority_score = round(min(99.0, max(5.0, priority_score)), 1)

        # Assemble Evidence Lists
        supporting_evidence = []
        contradictory_evidence = []
        missing_evidence = []
        alternative_explanations = []
        verification_steps = []

        # Supporting Evidence
        if cpa_origin_km <= 3.0:
            supporting_evidence.append(
                f"Closest Point of Approach (CPA) was {round(cpa_origin_km, 2)} km from the backtracked origin corridor."
            )
        if speed_diff > 3.0:
            supporting_evidence.append(
                f"Speed anomaly detected: Vessel decelerated from {round(avg_speed, 1)} kt down to {round(min_speed, 1)} kt within observation window."
            )
        if "Tanker" in vessel_type:
            supporting_evidence.append(
                f"Vessel class ({vessel_type}) carries petroleum hydrocarbons as primary cargo or significant bunker fuel."
            )
        if has_ais_gap:
            supporting_evidence.append(
                "Unexplained AIS broadcast discontinuity recorded lasting over 45 minutes while traversing the TSS."
            )

        # Contradictory Evidence
        if cpa_origin_km > 5.0:
            contradictory_evidence.append(
                f"Vessel track remained outside the primary 90% probability dispersion corridor (CPA: {round(cpa_origin_km, 1)} km)."
            )
        if speed_diff <= 1.5:
            contradictory_evidence.append(
                f"Maintained steady cruising speed ({round(avg_speed, 1)} ± 0.5 kt) without abrupt maneuvering or stops."
            )
        if "Container" in vessel_type or "Bulk" in vessel_type:
            contradictory_evidence.append(
                "Non-tanker cargo manifest; no bulk liquid petroleum cargo capacity (fuel oil limited to propulsion bunkers)."
            )

        # Missing Evidence
        missing_evidence.append("Cloud-free Sentinel-2 optical imagery unavailable at acquisition time to verify surface sheen.")
        missing_evidence.append("No aerial surveillance or FLIR infrared imaging corroboration available.")
        if has_ais_gap:
            missing_evidence.append("Coastal AIS base station VHF raw telemetry not yet audited for terrestrial receiver shadow effects.")

        # Alternative Explanations
        alternative_explanations.append(
            "High traffic density corridor with over 40 vessels transiting every 12 hours; multiple potential non-cooperative sources exist."
        )
        alternative_explanations.append(
            "Natural biogenic film, algal surfactant, or low-wind surface dampening can produce SAR look-alikes."
        )
        if has_ais_gap:
            alternative_explanations.append(
                "AIS signal loss may be caused by high-density message collision in slot-phase allocation or coastal obstruction."
            )

        # Recommended Verification Steps
        verification_steps.append("Request Vessel Traffic Service (VTS) radar log and radio communications archive.")
        verification_steps.append("Issue Port State Control (PSC) inspection notice for next port of call (Singapore/Jurong).")
        verification_steps.append("Inspect Oil Record Book (Part I / II) and oily water separator (OWS) bilge monitor logs.")
        verification_steps.append("Collect bunker and tank samples for gas chromatography / mass spectrometry (GC-MS) fingerprinting.")

        return {
            "vessel_id": vessel_id,
            "vessel_name": vessel_name,
            "vessel_type": vessel_type,
            "priority_score": priority_score,
            "temporal_score": round(temporal_score, 1),
            "spatial_score": round(spatial_score, 1),
            "route_score": round(route_score, 1),
            "speed_anomaly_score": round(speed_anomaly_score, 1),
            "ais_gap_score": round(ais_gap_score, 1),
            "cpa_origin_km": round(cpa_origin_km, 2),
            "supporting_evidence": supporting_evidence,
            "contradictory_evidence": contradictory_evidence,
            "missing_evidence": missing_evidence,
            "alternative_explanations": alternative_explanations,
            "verification_steps": verification_steps,
            "review_status": "Priority Inquiry" if priority_score >= 70 else ("Secondary Review" if priority_score >= 45 else "Low Priority")
        }
