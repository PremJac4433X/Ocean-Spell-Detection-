import math
from typing import List, Tuple, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in nautical miles."""
    return haversine_distance_km(lat1, lon1, lat2, lon2) * 0.539957

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate initial compass bearing from point 1 to point 2 in degrees."""
    dlon = math.radians(lon2 - lon1)
    y = math.sin(dlon) * math.cos(math.radians(lat2))
    x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) -
         math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlon))
    initial_bearing = math.atan2(y, x)
    initial_bearing = math.degrees(initial_bearing)
    return (initial_bearing + 360) % 360

def destination_point(lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
    """Calculate destination point given start point, distance in km and bearing in degrees."""
    R = 6371.0
    d_div_r = distance_km / R
    bearing_rad = math.radians(bearing_deg)
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)

    lat2 = math.asin(math.sin(lat1) * math.cos(d_div_r) +
                     math.cos(lat1) * math.sin(d_div_r) * math.cos(bearing_rad))
    lon2 = lon1 + math.atan2(math.sin(bearing_rad) * math.sin(d_div_r) * math.cos(lat1),
                             math.cos(d_div_r) - math.sin(lat1) * math.sin(lat2))
    return math.degrees(lat2), math.degrees(lon2)

def point_in_polygon(x: float, y: float, poly: List[Tuple[float, float]]) -> bool:
    """Ray casting algorithm for point in polygon."""
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside
