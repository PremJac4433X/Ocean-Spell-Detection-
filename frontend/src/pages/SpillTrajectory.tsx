import React, { useState } from 'react';
import {
  Wind,
  Compass,
  Play,
  RotateCcw,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TrajectorySimulationResult, LiveMarineConditions } from '../types';

export const SpillTrajectory: React.FC = () => {
  const { selectedIncidentId, setActivePage } = useApp();
  const [simulationType, setSimulationType] = useState<'forward_drift' | 'backward_backtrack'>('forward_drift');
  const [forecastHours, setForecastHours] = useState<number>(24);
  const [particleCount, setParticleCount] = useState<number>(100);
  const [windSpeed, setWindSpeed] = useState<number>(14.0);
  const [windDirection, setWindDirection] = useState<number>(230.0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.2);
  const [currentDirection, setCurrentDirection] = useState<number>(120.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<TrajectorySimulationResult | null>(null);

  // Live NOAA Integration State
  const [isFetchingNOAA, setIsFetchingNOAA] = useState<boolean>(false);
  const [noaaData, setNoaaData] = useState<LiveMarineConditions | null>(null);
  const [noaaError, setNoaaError] = useState<string | null>(null);

  const fetchLiveNOAAVectors = async () => {
    try {
      setIsFetchingNOAA(true);
      setNoaaError(null);
      const data = await api.getLiveMarineConditions(selectedIncidentId || undefined);
      setNoaaData(data);
      if (data.wind_speed_knots !== undefined) setWindSpeed(data.wind_speed_knots);
      if (data.wind_direction_deg !== undefined) setWindDirection(data.wind_direction_deg);
      if (data.current_speed_knots !== undefined) setCurrentSpeed(data.current_speed_knots);
      if (data.current_direction_deg !== undefined) setCurrentDirection(data.current_direction_deg);
    } catch (err: any) {
      console.error('Error fetching live NOAA marine conditions:', err);
      setNoaaError(err?.message || 'Failed to sync with live NOAA forecast API');
    } finally {
      setIsFetchingNOAA(false);
    }
  };

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true);
      const res = await api.runTrajectorySimulation({
        incident_id: selectedIncidentId || 'inc-malacca-01',
        simulation_type: simulationType,
        time_steps_hours: forecastHours,
        particle_count: particleCount,
        wind_speed_knots: windSpeed,
        wind_direction_deg: windDirection,
        current_speed_knots: currentSpeed,
        current_direction_deg: currentDirection
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Error running drift simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Spill Trajectory Prediction & Drift Simulation</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Lagrangian Particle Transport
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Coupled Ocean Surface Currents (HYCOM) & Wind Leeway (GFS) with Coriolis Deflection Angle
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-ocean-glow shrink-0 disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>INTEGRATING DRIFT EQUATIONS...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RUN DRIFT SIMULATION</span>
            </>
          )}
        </button>
      </div>

      {/* Main Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              1. Simulation Direction
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setSimulationType('forward_drift')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  simulationType === 'forward_drift'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                    : 'bg-ocean-850 text-slate-400 border-ocean-800 hover:text-slate-200'
                }`}
              >
                Forward Forecast (+48h)
              </button>
              <button
                onClick={() => setSimulationType('backward_backtrack')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  simulationType === 'backward_backtrack'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-ocean-850 text-slate-400 border-ocean-800 hover:text-slate-200'
                }`}
              >
                Origin Backtrack (-12h)
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {simulationType === 'forward_drift'
                ? 'Predicts future trajectory, spreading envelope, and coastal intersection ETA.'
                : 'Backtracks ocean currents and wind to identify plausible spill-origin regions.'}
            </p>
          </div>

          {/* Environmental Forcing Inputs */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                2. Oceanographic & Wind Forcing
              </h3>
              <button
                type="button"
                onClick={fetchLiveNOAAVectors}
                disabled={isFetchingNOAA}
                className="px-2.5 py-1 rounded bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Fetch live atmospheric and oceanic vectors using NOAA API integration"
              >
                <RefreshCw className={`w-3 h-3 text-cyan-400 ${isFetchingNOAA ? 'animate-spin' : ''}`} />
                <span>{isFetchingNOAA ? 'Syncing...' : 'Sync NOAA API'}</span>
              </button>
            </div>

            {/* NOAA Live Status Banner */}
            {noaaData && (
              <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-[11px] font-mono text-teal-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    Live NOAA Vectors Synced
                  </span>
                  <span className="text-[10px] text-teal-400/80">{noaaData.latency_ms} ms</span>
                </div>
                <div className="text-[10px] text-slate-300">
                  Source: <span className="text-teal-200">{noaaData.source}</span>
                </div>
                {noaaData.wave_height_m !== undefined && (
                  <div className="text-[10px] text-slate-400">
                    Wave Height: <span className="text-slate-200">{noaaData.wave_height_m} m</span>
                  </div>
                )}
              </div>
            )}

            {noaaError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{noaaError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Surface Wind Speed</span>
                  <span className="text-cyan-400 font-bold">{windSpeed.toFixed(1)} Knots</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={windSpeed}
                  onChange={e => setWindSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Wind Direction</span>
                  <span className="text-cyan-400 font-bold">{windDirection}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="5"
                  value={windDirection}
                  onChange={e => setWindDirection(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ocean Current Speed</span>
                  <span className="text-teal-400 font-bold">{currentSpeed.toFixed(1)} Knots</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={currentSpeed}
                  onChange={e => setCurrentSpeed(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Current Direction</span>
                  <span className="text-teal-400 font-bold">{currentDirection}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="5"
                  value={currentDirection}
                  onChange={e => setCurrentDirection(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800 text-[11px] text-slate-400 space-y-1 font-sans">
                <div>Source: <span className="text-slate-200 font-mono">NOAA GFS 0.25° / HYCOM 0.08°</span></div>
                <div>Leeway Factor: <span className="text-slate-200 font-mono">3.2% (empirical oil leeway)</span></div>
                <div>Coriolis Angle: <span className="text-slate-200 font-mono">+18.0° (Northern Hemisphere)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Results & Visual Simulation Canvas (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Particle Dispersion Display */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Lagrangian Particle Cloud & Dispersion Envelope
                </h3>
                <p className="text-[11px] text-slate-400">
                  {simulationType === 'forward_drift'
                    ? 'Advective-diffusive trajectory spreading showing 90% probability cone'
                    : 'Reverse backtrack probability cone to spill origin'}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-ocean-800 text-teal-300 border border-ocean-700">
                100 Particles
              </span>
            </div>

            {/* Simulated Particle Graphic Canvas */}
            <div className="relative w-full h-80 rounded-lg bg-ocean-950 border border-ocean-800 overflow-hidden flex items-center justify-center">
              {/* Radar Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#0e2554_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

              {/* Origin Point */}
              <div className="absolute left-24 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-pulse"></div>
                <span className="text-[10px] font-mono text-rose-300 mt-1">Origin (T=0)</span>
              </div>

              {/* Drift Vector Arrow & Dispersion Cone */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="coneGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Uncertainty Cone Polygon */}
                <polygon
                  points="100,160 380,80 400,240 100,160"
                  fill="url(#coneGrad)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Central Drift Axis Line */}
                <line
                  x1="100"
                  y1="160"
                  x2="390"
                  y2="160"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
              </svg>

              {/* Particles Cloud */}
              {[
                { x: 180, y: 155, r: 3 },
                { x: 210, y: 140, r: 2.5 },
                { x: 220, y: 170, r: 2.8 },
                { x: 260, y: 130, r: 3.2 },
                { x: 275, y: 185, r: 2.2 },
                { x: 310, y: 120, r: 3.5 },
                { x: 330, y: 195, r: 3.0 },
                { x: 350, y: 150, r: 4.0 },
                { x: 370, y: 110, r: 2.6 },
                { x: 385, y: 210, r: 2.4 }
              ].map((pt, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                ></div>
              ))}

              {/* Impact Threat Target */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 mt-1">Sisters' Islands (ETA 18.5h)</span>
              </div>
            </div>
          </div>

          {/* Model Output & Coastal Impact Summary */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Drift Dynamics & Coastal Impact Window
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Net Drift Velocity</span>
                <span className="text-base font-bold text-cyan-400">1.62 Knots</span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Drift Bearing</span>
                <span className="text-base font-bold text-teal-400">134.2° (SE)</span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Coastal Arrival ETA</span>
                <span className="text-base font-bold text-amber-400">18.5 Hours</span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">At-Risk Coastline</span>
                <span className="text-base font-bold text-rose-400">4.8 km</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-slate-200 block">Operational Containment Recommendation:</span>
              <p>
                Drift vectors converge toward the western inlet of Sisters' Islands Marine Park. Pre-emptive boom deployment recommended within 12 hours prior to arrival window.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActivePage('ocean-map')}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-ocean-glow"
              >
                <MapPin className="w-4 h-4" />
                <span>Overlay Particles on Interactive Ocean Map</span>
              </button>

              <button
                onClick={() => setActivePage('environmental-impact')}
                className="px-4 py-2 rounded-lg bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Assess Environmental Exposure</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
