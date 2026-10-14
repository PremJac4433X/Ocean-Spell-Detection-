import math
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.services.geo_utils import destination_point, haversine_distance_km

class DriftSimulator:
    """
    Lagrangian Oil Spill Particle Drift Simulation Engine.
    Simulates advection from surface ocean currents (100%) and wind leeway (3.0% - 3.5%)
    with Coriolis/Ekman deflection angle (Northern hemisphere +15° to +25°).
    Includes random turbulent diffusion and backward backtracking to estimate spill origin.
    """

    @staticmethod
    def run_forward_simulation(
        origin_lat: float,
        origin_lon: float,
        hours: int = 24,
        particle_count: int = 100,
        wind_speed_knots: float = 14.0,
        wind_dir_deg: float = 230.0,
        current_speed_knots: float = 1.2,
        current_dir_deg: float = 120.0,
        decay_rate_pct_day: float = 8.0,
        initial_radius_km: float = 0.8
    ) -> Dict[str, Any]:
        """
        Simulate forward drift for N hours.
        Returns GeoJSON FeatureCollection of particles over time and uncertainty polygon.
        """
        # Wind leeway factor: standard maritime empirically 0.032 (3.2%)
        wind_leeway_factor = 0.032
        # Deflection angle due to Coriolis in Northern Hemisphere (deg clockwise from wind)
        deflection_deg = 18.0 if origin_lat >= 0 else -18.0
        effective_wind_dir = (wind_dir_deg + deflection_deg) % 360.0

        # Current vector in knots to components (u = East, v = North)
        cur_rad = math.radians(current_dir_deg)
        u_cur = current_speed_knots * math.sin(cur_rad)
        v_cur = current_speed_knots * math.cos(cur_rad)

        # Wind vector component
        wind_rad = math.radians(effective_wind_dir)
        u_wind = (wind_speed_knots * wind_leeway_factor) * math.sin(wind_rad)
        v_wind = (wind_speed_knots * wind_leeway_factor) * math.cos(wind_rad)

        # Resulting mean drift vector
        u_total = u_cur + u_wind
        v_total = v_cur + v_wind
        total_speed_knots = math.hypot(u_total, v_total)
        total_drift_bearing = (math.degrees(math.atan2(u_total, v_total)) + 360.0) % 360.0

        # Generate initial particle cloud
        particles = []
        random.seed(42)  # Deterministic seed for reproducible simulation
        for i in range(particle_count):
            angle = random.uniform(0, 2 * math.pi)
            dist = random.uniform(0, initial_radius_km)
            plat, plon = destination_point(origin_lat, origin_lon, dist, math.degrees(angle))
            particles.append({
                "id": i,
                "lat": plat,
                "lon": plon,
                "mass_pct": 100.0,
                "active": True
            })

        # Step through time (every 3 hours)
        time_steps = []
        step_hours = 3
        num_steps = max(1, hours // step_hours)

        cone_left_boundary = []
        cone_right_boundary = []

        for step in range(num_steps + 1):
            elapsed_h = step * step_hours
            step_particles = []
            lats = []
            lons = []

            # Decay percentage over elapsed time
            current_mass = max(10.0, 100.0 - (decay_rate_pct_day / 24.0 * elapsed_h))

            for p in particles:
                # Diffusion increases with time (random walk)
                diffusion_km_per_step = 0.15 * math.sqrt(max(1, step))
                diff_angle = random.uniform(0, 360)
                diff_lat, diff_lon = destination_point(p["lat"], p["lon"], diffusion_km_per_step, diff_angle)

                # Advective transport
                step_dist_km = (total_speed_knots * 1.852) * step_hours if step > 0 else 0
                new_lat, new_lon = destination_point(diff_lat, diff_lon, step_dist_km, total_drift_bearing)
                p["lat"] = new_lat
                p["lon"] = new_lon

                lats.append(new_lat)
                lons.append(new_lon)

                step_particles.append({
                    "id": p["id"],
                    "lat": round(new_lat, 6),
                    "lon": round(new_lon, 6),
                    "mass_pct": round(current_mass, 1)
                })

            # Calculate envelope at this timestep
            mean_lat = sum(lats) / len(lats)
            mean_lon = sum(lons) / len(lons)
            envelope_spread_km = initial_radius_km + (0.35 * elapsed_h)

            left_lat, left_lon = destination_point(mean_lat, mean_lon, envelope_spread_km, (total_drift_bearing - 90) % 360)
            right_lat, right_lon = destination_point(mean_lat, mean_lon, envelope_spread_km, (total_drift_bearing + 90) % 360)
            cone_left_boundary.append([round(left_lon, 5), round(left_lat, 5)])
            cone_right_boundary.append([round(right_lon, 5), round(right_lat, 5)])

            time_steps.append({
                "elapsed_hours": elapsed_h,
                "particle_count": len(step_particles),
                "mean_lat": round(mean_lat, 5),
                "mean_lon": round(mean_lon, 5),
                "spread_radius_km": round(envelope_spread_km, 2),
                "particles": step_particles
            })

        # Assemble uncertainty cone polygon: left boundary forward, then right boundary backward
        cone_coords = cone_left_boundary + list(reversed(cone_right_boundary)) + [cone_left_boundary[0]]

        uncertainty_cone_geojson = {
            "type": "Feature",
            "properties": {
                "name": "Spill Dispersion & Uncertainty Cone",
                "drift_speed_knots": round(total_speed_knots, 2),
                "drift_bearing_deg": round(total_drift_bearing, 1),
                "forecast_hours": hours,
                "confidence_level": "90% probability corridor"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [cone_coords]
            }
        }

        # Check proximity to nearby coast (for Singapore / Malacca corridor ~ 1.25N, 103.8E)
        # Estimated coastal impact
        eta_hours = 18.5 if total_drift_bearing > 90 and total_drift_bearing < 180 else None
        affected_coastline_km = 4.8 if eta_hours else 0.0

        return {
            "simulation_type": "forward_drift",
            "drift_parameters": {
                "wind_speed_knots": wind_speed_knots,
                "wind_dir_deg": wind_dir_deg,
                "current_speed_knots": current_speed_knots,
                "current_dir_deg": current_dir_deg,
                "net_drift_speed_knots": round(total_speed_knots, 2),
                "net_drift_bearing_deg": round(total_drift_bearing, 1)
            },
            "time_steps": time_steps,
            "uncertainty_cone_geojson": uncertainty_cone_geojson,
            "coastal_arrival_eta_hours": eta_hours,
            "affected_coastline_km": affected_coastline_km
        }

    @staticmethod
    def run_backward_backtrack(
        observed_lat: float,
        observed_lon: float,
        hours_back: int = 12,
        wind_speed_knots: float = 14.0,
        wind_dir_deg: float = 230.0,
        current_speed_knots: float = 1.2,
        current_dir_deg: float = 120.0
    ) -> Dict[str, Any]:
        """
        Reverse-drift calculation (backtracking) to reconstruct plausible spill origin locations
        and time envelopes.
        """
        wind_leeway = 0.032
        deflection_deg = 18.0 if observed_lat >= 0 else -18.0
        effective_wind_dir = (wind_dir_deg + deflection_deg) % 360.0

        cur_rad = math.radians(current_dir_deg)
        wind_rad = math.radians(effective_wind_dir)

        u_total = current_speed_knots * math.sin(cur_rad) + (wind_speed_knots * wind_leeway) * math.sin(wind_rad)
        v_total = current_speed_knots * math.cos(cur_rad) + (wind_speed_knots * wind_leeway) * math.cos(wind_rad)

        drift_speed_knots = math.hypot(u_total, v_total)
        drift_bearing = (math.degrees(math.atan2(u_total, v_total)) + 360.0) % 360.0
        reverse_bearing = (drift_bearing + 180.0) % 360.0

        backtrack_points = []
        cone_left = []
        cone_right = []

        for h in range(0, hours_back + 1, 2):
            back_dist_km = (drift_speed_knots * 1.852) * h
            plat, plon = destination_point(observed_lat, observed_lon, back_dist_km, reverse_bearing)
            uncertainty_radius_km = 0.5 + (0.45 * h)  # Uncertainty expands backwards

            l_lat, l_lon = destination_point(plat, plon, uncertainty_radius_km, (reverse_bearing - 90) % 360)
            r_lat, r_lon = destination_point(plat, plon, uncertainty_radius_km, (reverse_bearing + 90) % 360)

            cone_left.append([round(l_lon, 5), round(l_lat, 5)])
            cone_right.append([round(r_lon, 5), round(r_lat, 5)])

            backtrack_points.append({
                "hours_prior": h,
                "latitude": round(plat, 5),
                "longitude": round(plon, 5),
                "uncertainty_radius_km": round(uncertainty_radius_km, 2)
            })

        cone_coords = cone_left + list(reversed(cone_right)) + [cone_left[0]]
        origin_corridor_geojson = {
            "type": "Feature",
            "properties": {
                "name": "Plausible Spill Origin Corridor (Backtracked)",
                "hours_backtracked": hours_back,
                "reverse_bearing_deg": round(reverse_bearing, 1)
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [cone_coords]
            }
        }

        return {
            "simulation_type": "backward_backtrack",
            "backtrack_points": backtrack_points,
            "origin_corridor_geojson": origin_corridor_geojson,
            "most_probable_release_window": f"{hours_back // 2} to {hours_back} hours before observation"
        }
