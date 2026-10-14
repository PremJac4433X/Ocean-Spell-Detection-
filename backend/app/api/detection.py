from fastapi import APIRouter, HTTPException
from app.schemas.schemas import DetectionAnalyzeRequest, DetectionAnalyzeResponse
from app.services.sar_detector import SAROilSpillDetector

router = APIRouter(prefix="/detection", tags=["Detection"])

@router.post("/analyze", response_model=DetectionAnalyzeResponse)
def analyze_satellite_scene(data: DetectionAnalyzeRequest):
    """
    Executes Synthetic Aperture Radar (SAR) oil slick detection pipeline.
    Validates scene input, performs speckle filtering, CFAR thresholding,
    damping ratio calculation, boundary polygonization, and look-alike risk estimation.
    """
    preset = data.region_preset or "malacca_strait"
    if preset not in SAROilSpillDetector.PRESETS:
        preset = "malacca_strait"

    result = SAROilSpillDetector.analyze_scene(
        preset_key=preset,
        sensitivity=data.threshold_sensitivity,
        polarization=data.polarization
    )
    return result

@router.get("/presets")
def list_available_sar_presets():
    """Returns available demonstration SAR imagery scenes."""
    return [
        {
            "key": k,
            "name": v["name"],
            "satellite": v["satellite"],
            "scene_id": v["scene_id"],
            "wind_speed_ms": v["wind_speed_ms"],
            "damping_ratio_db": v["damping_ratio_db"],
            "area_km2": v["area_km2"],
            "confidence": v["confidence"]
        }
        for k, v in SAROilSpillDetector.PRESETS.items()
    ]
