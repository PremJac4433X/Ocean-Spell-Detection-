# OCEAN GUARD AI 🌊🛰️
### AI-Powered Oil Spill Detection, Vessel Tracking, Route Investigation, and Marine Environmental Protection System

> **College Innovation Competition Master Submission**  
> *A unified decision-support platform designed to monitor maritime corridors, detect oil slicks from satellite radar imagery, track and rank candidate vessels using transparent multi-criteria evidence matrices, simulate hydrodynamic drift, and safeguard vulnerable coastal marine habitats.*

---

## 🌟 Executive Summary

**OCEAN GUARD AI** addresses a critical global challenge: clandestine and accidental marine oil pollution along international shipping corridors (such as the Singapore Strait, Malacca Traffic Separation Scheme, and the Gulf of Mexico). 

By uniting **Sentinel-1 C-Band Synthetic Aperture Radar (SAR)** satellite imagery analysis, **AIS (Automatic Identification System)** real-time vessel tracking, **Lagrangian hydrodynamic drift simulation**, and a **transparent multi-factor investigation-priority scoring engine**, the platform enables maritime environmental authorities (e.g., Port State Control, Coast Guard, UNEP) to rapidly identify discharges, prioritize vessels for inspection, and protect fragile coastal ecosystems.

---

## ⚖️ Core Scientific & Legal Principle

> **"Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility. Results depend on data availability, model assumptions, and independent verification."**

In accordance with international maritime law (**UNCLOS Art. 218** and **MARPOL 73/78 Annex I**), OCEAN GUARD AI explicitly avoids automated culpability:
1. **Prioritization vs. Accusation:** Vessel scores determine Port State Control (PSC) boarding and inspection priority—never guilt.
2. **AIS Discontinuity Neutrality:** Transmission gaps can arise from antenna blind spots, high-traffic VHF slot collisions, or meteorological attenuation. Gaps are flagged for review, not treated as proof of deliberate shutdown.
3. **SAR Look-Alike Awareness:** C-band radar damping can be produced by biogenic films (algal blooms), low surface winds (< 3 m/s), or internal waves. Confidence reflects algorithm pattern fit, not confirmed petroleum release.
4. **Hydrodynamic Backtracking:** Vessels are never ranked on distance alone; positions are correlated with reverse-drift origin envelopes.

---

## 🚀 Key System Features & Navigation Modules

The system provides 13 persistent, fully interactive command modules:

| # | Module | Core Functionality |
|---|---|---|
| **1** | **Overview Dashboard** | Real-time KPIs, active slick candidates, corridor vessel traffic, detection confidence distributions, 7-day surface area trends, and system status. |
| **2** | **Live Ocean Map** | Interactive MapLibre GL geospatial map with toggleable layers for oil slick polygons, commercial vessels, AIS historical track replays, TSS shipping lanes, and Marine Protected Areas (MPAs). |
| **3** | **Oil Spill Detection Workspace** | Sentinel-1 SAR C-band analysis workspace with adjustable CFAR threshold sensitivity, VV/VH polarization modes, radar backscatter damping ratio metrics, and vector polygonization. |
| **4** | **Vessel Intelligence** | Searchable commercial vessel directory with MMSI, IMO, flag, dimensions, speed over ground, heading, destination, and historical position logs. |
| **5** | **Route Investigation** | Synchronized chronological timeline aligning satellite capture time ($T=0$), vessel AIS points, plausible release windows, and speed drop anomalies. |
| **6** | **AI Vessel Ranking** | Multi-criteria priority engine with transparent factor weighting (Temporal 30%, Spatial CPA 25%, Route Alignment 20%, Speed Anomaly 15%, AIS Continuity 10%) with supporting, contradictory, and missing evidence matrices. |
| **7** | **Spill Trajectory Prediction** | Coupled ocean current (HYCOM) & wind leeway (GFS) Lagrangian particle drift simulation supporting forward forecasting (+48h) and reverse backtracking (-12h). |
| **8** | **Environmental Impact** | Environmental Sensitivity Index (ESI 1-10) scoring for marine sanctuaries, coral reefs, mangrove wetlands, coastal arrival ETA, and containment boom recommendations. |
| **9** | **Incident Management** | Complete incident lifecycle workflow: *Unverified* → *Under Review* → *Verified* → *Response Active* → *Contained* → *Closed* with reviewer notes and audit logs. |
| **10** | **AI Model Analytics** | Deep dive into SAR feature discrimination: damping ratio curves (dB), biogenic film vs mineral oil boundaries, and precision-recall trade-offs. |
| **11** | **Reports & Exports** | Printable official Incident Dossier (PDF layout) and raw candidate data export in CSV format for GIS/Excel auditing. |
| **12** | **Data Sources** | Provenance tracking for Copernicus Sentinel-1, AISHub, NOAA HYCOM/GFS, and WDPA Marine Protected Areas with latency and health metrics. |
| **13** | **Settings** | Customizable scoring algorithm weights, hydrodynamic leeway factors, Coriolis deflection angles, and nautical units. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with deep navy command-center aesthetic (`#070f22`), cyan/teal accents, and amber/rose alerts
- **Interactive Maps:** MapLibre GL JS with custom dark nautical vector tiles & SVG overlays
- **Data Visualization:** Recharts (Area charts, bar charts, line graphs, donut charts)
- **Icons:** Lucide React

### Backend
- **Framework:** Python FastAPI with Pydantic validation
- **Database:** SQLAlchemy 2.0 with SQLite (local out-of-the-box demo) / PostgreSQL PostGIS ready
- **Scientific Algorithms:**
  - `DriftSimulator`: Lagrangian advection-diffusion particle tracking with Coriolis deflection
  - `SAROilSpillDetector`: Adaptive CFAR and Lee speckle filtering simulation with damping ratio extraction
  - `VesselRanker`: Multi-factor evidence-based priority scoring engine
  - `GeoUtils`: Haversine geodesy, compass bearing calculations, and polygon spatial operations

---

## 🏁 Getting Started (Local Setup)

### 1. Environment Configuration & API Credentials
Copy `.env.example` to `backend/.env` (and/or project root `.env`) and supply your API credentials:
```bash
cp .env.example backend/.env
```
Key environment variables:
- `API_KEY`: Global secret token for authenticated external services.
- `NOAA_API_KEY`: Authentication credential for live NOAA GFS (Global Forecast System) and HYCOM marine circulation data.
- `COPERNICUS_API_KEY`: Access token for Copernicus Sentinel-1 SAR and Sentinel-2 optical imagery catalogs.
- `AIS_DATA_API_KEY`: API key for real-time AIS vessel tracking stream (e.g., AISStream or AISHub).
- `DEMO_MODE`: Set to `False` to force live external provider ingestion.

> **Security Note:** `.env` is registered in `.gitignore` and must never be committed to source control. Secret keys are loaded server-side only in FastAPI and are never exposed to browser bundles or client console logs.

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m app.main
```
The FastAPI backend will start on `http://localhost:8000`.
- Interactive API Docs: `http://localhost:8000/api/docs`
- Health Endpoint: `http://localhost:8000/api/health`
- Live Marine Conditions: `http://localhost:8000/api/trajectory/live-marine-conditions`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React command center will open on `http://localhost:5173`.

### 4. Running Automated Tests
```bash
cd backend
python -m app.tests.test_api
```

---

## ☁️ Production Deployment & Secrets Management

When deploying to cloud platforms (Docker, Render, AWS ECS, Google Cloud Run, Railway, or Fly.io):
1. **Set Environment Variables in Platform Settings:** Add `NOAA_API_KEY`, `API_KEY`, and `DATABASE_URL` in the platform's Environment Variables / Secrets Manager dashboard.
2. **Never commit `.env` files:** The application checks `os.getenv` automatically after dotenv initialization.
3. **Frontend Isolation:** Client requests route through the backend proxy `/api/trajectory/live-marine-conditions`. The frontend bundle contains zero API secrets.
4. **Log Scrubbing:** The backend `NOAAMarineService` masks headers and scrubs error traces to ensure authorization secrets are never emitted in cloud logs.

---

## 🎤 5-Minute Innovation Competition Presentation Script

### Minute 1: The Problem & Vision
> *"Honorable judges, over 40% of global marine oil pollution does not come from catastrophic tanker disasters, but from deliberate, illegal high-seas bilge discharges and unmonitored leaks along busy shipping routes. By the time a slick reaches the shore, attributing it to a specific ship among dozens of transiting vessels is nearly impossible. Today, we present **OCEAN GUARD AI**—a unified maritime intelligence and satellite surveillance platform that connects spaceborne radar with real-time AIS intelligence to protect our oceans."*

### Minute 2: Satellite Detection & Spaceborne SAR
> *"Let's navigate to the **Oil Spill Detection Workspace**. Optical cameras cannot see through clouds or at night. We utilize European Space Agency Sentinel-1 Synthetic Aperture Radar. Oil dampens short capillary sea waves, creating distinct dark backscatter patches. Our pipeline extracts the damping ratio in decibels, tests against surface wind conditions to exclude look-alikes like algal blooms, and calculates the exact slick geometry—here, 4.65 km² in the Straits of Malacca."*

### Minute 3: Origin Backtracking & AIS Trajectory Alignment
> *"A satellite image only tells us where the slick is right now. Where was it released? In the **Spill Trajectory module**, we run a reverse Lagrangian drift simulation, combining NOAA ocean currents and wind leeway. This reconstructs the probable release corridor 4 to 8 hours prior. When we overlay the AIS tracking data in our **Route Investigation module**, we observe six ships that traversed the corridor—but one vessel, crude tanker *MT Pacific Osprey*, crossed within 1.4 kilometers of the origin window while experiencing an uncharacteristic speed drop and a 48-minute AIS broadcast gap."*

### Minute 4: Transparent Multi-Factor Priority Scoring
> *"In our **Vessel Ranking Dashboard**, we do not make accusations. Section 12 enforces our core ethos: priority scores reflect evidence for investigation, not guilt. Our transparent engine breaks down temporal fit (30%), spatial CPA (25%), route alignment (20%), speed profile (15%), and AIS continuity (10%). For every vessel, we display supporting evidence, contradictory evidence, missing data gaps, and recommended verification steps—such as requesting Port State Control oil record book inspections at their next port of call."*

### Minute 5: Environmental Protection & Containment
> *"Finally, in our **Environmental Impact Dashboard**, the forward drift forecast predicts a high-risk exposure window of 18.5 hours before shoreline impact at Sisters' Islands Marine Sanctuary. The system suggests pre-emptive boom deployment zones and generates an official **Incident Dossier PDF** ready for regulatory authorities. OCEAN GUARD AI turns raw satellite telemetry and AIS signals into actionable environmental justice. Thank you!"*

---

## 📜 License
Developed for educational, research, and maritime innovation competition evaluation.
