import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Leaf,
  AlertTriangle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Info,
  Clock,
  Compass,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { EnvironmentalAsset } from '../types';

export const EnvironmentalImpact: React.FC = () => {
  const { selectedIncidentId, setActivePage } = useApp();
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEnvRisk = async () => {
      try {
        setLoading(true);
        const data = await api.getEnvironmentalRisk(selectedIncidentId);
        setRiskData(data);
      } catch (err) {
        console.error('Error fetching environmental risk:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnvRisk();
  }, [selectedIncidentId]);

  if (loading || !riskData) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-sm animate-pulse">
          EVALUATING ECOLOGICAL VULNERABILITY INDICES (ESI)...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Marine Environmental Impact & Ecological Vulnerability</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40">
              ESI Risk Assessment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exposure Risk Analysis for Marine Protected Areas (MPAs), Coral Reef Sanctuaries, and Coastal Wetlands
          </p>
        </div>

        <button
          onClick={() => setActivePage('ocean-map')}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-ocean-glow shrink-0"
        >
          <MapPin className="w-4 h-4" />
          <span>View Protected Polygons on Map</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Monitored Protected Zones</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{riskData.total_protected_areas} MPAs</div>
          <span className="text-[11px] text-teal-400 mt-1 block">WDPA Catalogued</span>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Critical Exposure Threats</span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{riskData.critical_exposure_count} Sanctuaries</div>
          <span className="text-[11px] text-rose-300 mt-1 block">High Vulnerability (ESI ≥ 8)</span>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Closest Sensitive Habitat</span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{riskData.closest_habitat_distance_km} km</div>
          <span className="text-[11px] text-slate-300 truncate block mt-1">{riskData.closest_habitat_name}</span>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Estimated Arrival Window</span>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">{riskData.coastal_arrival_eta_hours} Hours</div>
          <span className="text-[11px] text-cyan-300 mt-1 block">Based on Current Drift</span>
        </div>
      </div>

      {/* Habitats Table & Containment Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habitats List (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Potentially Affected Marine Resources & Protected Areas
            </h3>
            <span className="text-[10px] font-mono text-slate-400">UNEP-WCMC Data Standard</span>
          </div>

          <div className="space-y-3">
            {riskData.vulnerable_assets.map((asset: EnvironmentalAsset) => {
              let riskBadge = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
              if (asset.exposure_risk === 'Imminent High Risk') riskBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              else if (asset.exposure_risk === 'Potential') riskBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

              return (
                <div
                  key={asset.id}
                  className="p-4 rounded-lg bg-ocean-850 border border-ocean-800 hover:border-ocean-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{asset.name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">{asset.asset_type}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold border font-mono ${riskBadge}`}>
                      {asset.exposure_risk}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{asset.description}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ocean-800 text-[11px] font-mono text-slate-400">
                    <div>
                      <span>COORDINATES: </span>
                      <strong className="text-slate-200">{asset.latitude.toFixed(4)}°N, {asset.longitude.toFixed(4)}°E</strong>
                    </div>
                    <div>
                      <span>VULNERABILITY: </span>
                      <strong className="text-rose-400">ESI {asset.vulnerability_index}/10</strong>
                    </div>
                    <div>
                      <span>DISTANCE: </span>
                      <strong className="text-cyan-400">{asset.distance_to_spill_km} km</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Response Containment Plan */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Suggested Containment Strategy
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Priority deployment zones determined by hydrodynamic trajectory modeling and shoreline ESI ratings:
            </p>

            <div className="space-y-2.5">
              {riskData.suggested_containment_zones.map((zone: string, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-ocean-850 border border-ocean-800 flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{zone}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              <strong className="block font-semibold">Precautionary Threshold:</strong>
              Marine boom mobilization must commence at least 6 hours before predicted shoreline arrival window.
            </div>

            <button
              onClick={() => setActivePage('reports-exports')}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-ocean-glow"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Full Environmental Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
