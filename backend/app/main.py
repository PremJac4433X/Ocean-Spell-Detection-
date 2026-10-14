from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import api_router
from app.services.sample_data import seed_sample_database

# Create tables
Base.metadata.create_all(bind=engine)

# Seed database with sample demonstration scenario
db = SessionLocal()
try:
    seed_sample_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Oil Spill Detection, Vessel Tracking, Route Investigation, and Marine Environmental Protection System",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "title": "Ocean Guard AI Platform",
        "description": "Marine Environmental Protection & Maritime Surveillance API",
        "version": settings.APP_VERSION,
        "api_docs": "/api/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
