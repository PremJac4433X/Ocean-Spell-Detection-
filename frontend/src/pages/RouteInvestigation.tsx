import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Clock,
  Compass,
  AlertTriangle,
  Ship,
  Navigation,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Incident, Vessel } from '../types';

export const RouteInvestigation: React.FC = () => {
  const { selectedIncidentId, setActivePage } = useApp();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<string>('vsl-001');
  const [timeWindowHours, setTimeWindowHours] = useState<number>(10);
  const [radiusNm, setRadiusNm] = useState<number>(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (selectedIncidentId) {
          const inc = await api.getIncident(selectedIncidentId);
          setIncident(inc);
        }
        const vsls = await api.getVessels();
        setVessels(vsls);
      } catch (err) {
        console.error('Error fetching route investigation data:', err);
      }
    };
    fetchData();
  }, [selectedIncidentId]);

  const activeVessel = vessels.find(v => v.id === selectedVesselId) || vessels[0];

  // Timeline events synchronized relative to satellite capture time T=0
  const timelineEvents = [
    {
      timeOffset: '-8.0h UTC',
      label: 'Earliest Plausible Release Window (Backtrack Boundary)',
      actor: 'Physical Drift Model',
      type: 'model',
      detail: 'Lagrangian reverse advection under 14kt SW wind and 1.2kt current.'
    },
    {
      timeOffset: '-5.0h UTC',
      label: 'Vessel MT Pacific Osprey enters Sector Corridor',
      actor: 'MT Pacific Osprey (MMSI: 563012340)',
      type: 'vessel',
      detail: 'Cruising steady at 13.0 kt on heading 119° in eastbound TSS lane.'
    },
    {
      timeOffset: '-4.2h UTC',
      label: 'AIS Broadcast Gap Initiated & Deceleration Detected',
      actor: 'MT Pacific Osprey',
      type: 'anomaly',
      detail: 'Speed drops from 13.0 kt to 8.2 kt. No positional broadcasts for 48 minutes.'
    },
    {
      timeOffset: '-3.4h UTC',
      label: 'Intersection of Plausible Spill-Origin Envelope',
      actor: 'Corridor Overlap',
      type: 'overlap',
      detail: 'Vessel trajectory aligns within 1.4 km of backtracked origin centroid.'
    },
    {
      timeOffset: '-2.5h UTC',
      label: 'AIS Transmission Resumes',
      actor: 'MT Pacific Osprey',
      type: 'vessel',
      detail: 'Speed returns to 11.8 kt on heading 116° approaching SOP anchorage.'
    },
    {
      timeOffset: '0.0h UTC',
      label: 'Sentinel-1A SAR Satellite Observation & Detection',
      actor: 'Copernicus SAR Payload',
      type: 'satellite',
      detail: 'C-band SAR IW acquisition captures 4.65 km² dark formation. Confidence: 88%.'
    },
    {
      timeOffset: '+3.0h UTC (Now)',
      label: 'Multi-Criteria Investigation & Forward Drift Forecast',
      actor: 'Ocean Guard AI',
      type: 'now',
      detail: 'Forward simulation indicates drift toward Sisters\' Islands Marine Reserve.'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Historical Route Investigation & Origin Backtracking</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Synchronized Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconstructing Vessel Passages Across Plausible Release Windows & Reversing Surface Drift
          </p>
        </div>

        <button
          onClick={() => setActivePage('vessel-ranking')}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-ocean-glow shrink-0"
        >
          <span>Examine Multi-Factor Vessel Rankings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Corridor Controls & Target Vessel Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Investigation Horizon Parameters
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Historical Time Window</span>
                <span className="text-cyan-400 font-bold">{timeWindowHours} Hours Prior</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={timeWindowHours}
                onChange={e => setTimeWindowHours(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Corridor Radius</span>
                <span className="text-cyan-400 font-bold">{radiusNm} NM (~{(radiusNm * 1.852).toFixed(0)} km)</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={radiusNm}
                onChange={e => setRadiusNm(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-ocean-800 text-[11px] text-slate-400 space-y-1 font-sans">
              <span className="font-semibold text-slate-300 block font-mono text-xs">Target Incident:</span>
              <div className="text-slate-200 font-medium">{incident?.name || 'Malacca Strait Slick Alpha'}</div>
              <div className="text-[10px] font-mono text-cyan-400">{incident?.incident_code || 'OG-2026-0881'}</div>
            </div>
          </div>
        </div>

        {/* Selected Vessel Selector */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400" />
              Focus Vessel Track Inspection
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {vessels.length} Candidates Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {vessels.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVesselId(v.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedVesselId === v.id
                    ? 'bg-cyan-500/10 border-cyan-500 text-slate-100 shadow-sm'
                    : 'bg-ocean-850 border-ocean-800 text-slate-400 hover:text-slate-200 hover:border-ocean-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200 truncate">{v.name}</div>
                <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{v.vessel_type}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">MMSI: {v.mmsi}</div>
              </button>
            ))}
          </div>

          {activeVessel && (
            <div className="p-3.5 rounded-lg bg-ocean-850 border border-ocean-750 text-xs text-slate-300 flex items-center justify-between font-mono">
              <div>
                <span>Selected: <strong className="text-cyan-300 font-sans">{activeVessel.name}</strong> ({activeVessel.flag})</span>
                <div className="text-[10px] text-slate-400">CPA to Backtracked Origin: 1.4 km | Speed Drop: 5.6 kt</div>
              </div>
              <button
                onClick={() => setActivePage('ocean-map')}
                className="px-3 py-1.5 rounded bg-ocean-800 hover:bg-cyan-500 hover:text-ocean-950 text-cyan-300 font-sans font-medium text-[11px] transition-colors"
              >
                Inspect on Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Timeline */}
      <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
        <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Synchronized Spatio-Temporal Investigation Chronology
            </h3>
            <p className="text-[11px] text-slate-400">
              Aligning satellite capture time, vessel GPS reports, speed anomalies, and reverse drift calculations
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Observation ≠ Spill Release Time
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-ocean-800">
          {timelineEvents.map((ev, idx) => {
            let badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
            let dotBg = 'bg-cyan-400';
            if (ev.type === 'anomaly') {
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              dotBg = 'bg-amber-400';
            } else if (ev.type === 'satellite') {
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              dotBg = 'bg-rose-500';
            } else if (ev.type === 'model') {
              badgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
              dotBg = 'bg-teal-400';
            }

            return (
              <div key={idx} className="relative group">
                <span className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ${dotBg} ring-4 ring-ocean-900`}></span>
                <div className="p-3.5 rounded-lg bg-ocean-850 border border-ocean-800 hover:border-ocean-700 transition-all space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{ev.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-ocean-900 text-slate-300 border-ocean-750">
                      {ev.timeOffset}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">{ev.actor}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    {ev.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
