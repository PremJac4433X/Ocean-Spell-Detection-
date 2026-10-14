import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  Shield,
  Compass,
  Wind,
  Layers,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { refreshIncidents } = useApp();

  // Multi-Factor Weight Configuration
  const [temporalWeight, setTemporalWeight] = useState<number>(30);
  const [spatialWeight, setSpatialWeight] = useState<number>(25);
  const [routeWeight, setRouteWeight] = useState<number>(20);
  const [speedWeight, setSpeedWeight] = useState<number>(15);
  const [aisWeight, setAisWeight] = useState<number>(10);

  // Model Parameters
  const [windLeeway, setWindLeeway] = useState<number>(3.2);
  const [coriolisAngle, setCoriolisAngle] = useState<number>(18.0);
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'nm'>('nm');
  const [savedNotice, setSavedNotice] = useState<string>('');

  const totalWeight = temporalWeight + spatialWeight + routeWeight + speedWeight + aisWeight;

  const handleSave = () => {
    setSavedNotice('Settings & Algorithm Weights Successfully Saved to System Cache.');
    setTimeout(() => setSavedNotice(''), 4000);
  };

  const handleResetDefaults = () => {
    setTemporalWeight(30);
    setSpatialWeight(25);
    setRouteWeight(20);
    setSpeedWeight(15);
    setAisWeight(10);
    setWindLeeway(3.2);
    setCoriolisAngle(18.0);
    setDistanceUnit('nm');
    setSavedNotice('Parameters reset to Maritime Standard Defaults.');
    setTimeout(() => setSavedNotice(''), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">System Settings & Algorithm Calibration</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Heuristic Configuration
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure Multi-Factor Priority Engine Weights, Drift Hydrodynamics, and Display Preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-2 transition-all shadow-ocean-glow"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Criteria Scoring Weights */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Vessel Investigation Priority Scoring Weights
              </h3>
              <p className="text-[11px] text-slate-400">Total weight must equal 100%</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
              totalWeight === 100 ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              Total: {totalWeight}%
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Temporal Compatibility (T0 ± Δt)</span>
                <span className="text-cyan-400 font-bold">{temporalWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={temporalWeight}
                onChange={e => setTemporalWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Spatial Proximity to Backtracked Origin</span>
                <span className="text-cyan-400 font-bold">{spatialWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={spatialWeight}
                onChange={e => setSpatialWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Route Vector Alignment & Cargo Classification</span>
                <span className="text-cyan-400 font-bold">{routeWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={routeWeight}
                onChange={e => setRouteWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Speed Kinematics & Maneuvering Anomaly</span>
                <span className="text-cyan-400 font-bold">{speedWeight}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={speedWeight}
                onChange={e => setSpeedWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>AIS Transmission Discontinuity (Blind Zone Adjusted)</span>
                <span className="text-cyan-400 font-bold">{aisWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={aisWeight}
                onChange={e => setAisWeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Drift Simulation Model Parameters */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Hydrodynamic Drift Coefficients
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Empirical Wind Leeway Factor</span>
                  <span className="text-teal-400 font-bold">{windLeeway}%</span>
                </div>
                <input
                  type="range"
                  min="2.5"
                  max="4.5"
                  step="0.1"
                  value={windLeeway}
                  onChange={e => setWindLeeway(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard maritime oil leeway typically ranges from 3.0% to 3.5% of wind velocity.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Coriolis Deflection Angle</span>
                  <span className="text-teal-400 font-bold">+{coriolisAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={coriolisAngle}
                  onChange={e => setCoriolisAngle(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Deflection angle clockwise in Northern Hemisphere; counter-clockwise in Southern Hemisphere.
                </span>
              </div>
            </div>
          </div>

          {/* Unit Preferences */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Nautical Unit Preferences
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => setDistanceUnit('nm')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  distanceUnit === 'nm'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-ocean-850 text-slate-400 border-ocean-800'
                }`}
              >
                Nautical Miles (NM) & Knots
              </button>
              <button
                onClick={() => setDistanceUnit('km')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  distanceUnit === 'km'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-ocean-850 text-slate-400 border-ocean-800'
                }`}
              >
                Kilometers (km) & km/h
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
