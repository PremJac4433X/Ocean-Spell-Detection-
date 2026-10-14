import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env file
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "Ocean Guard AI"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ocean_guard.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")
    API_KEY: str = os.getenv("API_KEY", "")
    COPERNICUS_API_KEY: str = os.getenv("COPERNICUS_API_KEY", "")
    AIS_DATA_API_KEY: str = os.getenv("AIS_DATA_API_KEY", "")
    NOAA_API_KEY: str = os.getenv("NOAA_API_KEY", "")

settings = Settings()
