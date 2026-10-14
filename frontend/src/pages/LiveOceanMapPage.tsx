import React, { useState, useEffect } from 'react';
import {
  Ship,
  AlertTriangle,
  Compass,
  Layers,
  ChevronRight,
  Wind,
  Navigation,
  Shield,
  Clock,
  ArrowRight,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OceanMap } from '../components/map/OceanMap';
import { Incident, Vessel, TrajectorySimulationResult, EnvironmentalAsset } from '../types';

export const LiveOceanMapPage: React.FC = () => {
  const { selectedIncidentId, setSelectedIncidentId, setActivePage } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectorySimulationResult | null>(null);
  const [envAssets, setEnvAssets] = useState<EnvironmentalAsset[]>([]);
  const [vesselFilter, setVesselFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [incData, vslData, envData] = await Promise.all([
          api.getIncidents(),
          api.getVessels(),
          api.getEnvironmentalRisk().then(res => res.vulnerable_assets).catch(() => [])
        ]);
        setIncidents(incData);
        setVessels(vslData);
        setEnvAssets(envData);

        if (selectedIncidentId) {
          try {
            const traj = await api.getLatestSimulation(selectedIncidentId);
            setTrajectory(traj);
          } catch (e) {
            // Trajectory optional
          }
        }
      } catch (err) {
        console.error('Error loading ocean map data:', err);
      }
    };
    loadMapData();
  }, [selectedIncidentId]);

  const activeIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  const filteredVessels = vessels.filter(v => {
    const matchesFilter = vesselFilter === 'All' || v.vessel_type.includes(vesselFilter);
    const matchesQuery =
      searchQuery === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.mmsi.includes(searchQuery);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Main Map View */}
      <div className="flex-1 h-full relative">
        <OceanMap
          incidents={incidents}
          vessels={filteredVessels}
          selectedIncident={activeIncident}
          selectedVessel={selectedVessel || undefined}
          onSelectIncident={inc => {
            setSelectedIncidentId(inc.id);
            setSelectedVessel(null);
          }}
          onSelectVessel={v => setSelectedVessel(v)}
          trajectory={trajectory}
          environmentalAssets={envAssets}
        />
      </div>

      {/* Right Intelligence Inspector Drawer */}
      <div className="w-80 bg-ocean-900 border-l border-ocean-800 flex flex-col shrink-0 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 border-b border-ocean-800 bg-ocean-950/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              TACTICAL INSPECTOR
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-800 text-slate-300 border border-ocean-700">
              GIS ACTIVE
            </span>
          </div>

          {/* Quick Search */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vessel or MMSI..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-ocean-950 border border-ocean-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Selected Vessel Inspector (if clicked) */}
        {selectedVessel ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-cyan-400" />
                Vessel Profile
              </span>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono"
              >
                Clear
              </button>
            </div>

            <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-750 space-y-2">
              <div className="text-sm font-bold text-slate-100">{selectedVessel.name}</div>
              <div className="text-xs text-cyan-400 font-mono">{selectedVessel.vessel_type}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ocean-800 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">MMSI</span>
                  <span className="text-slate-200">{selectedVessel.mmsi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IMO</span>
                  <span className="text-slate-200">{selectedVessel.imo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SPEED / COURSE</span>
                  <span className="text-slate-200">{selectedVessel.speed_knots} kt @ {selectedVessel.course_deg}°</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">FLAG</span>
                  <span className="text-slate-200">{selectedVessel.flag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DIMENSIONS</span>
                  <span className="text-slate-200">{selectedVessel.length_m}m × {selectedVessel.width_m}m</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DESTINATION</span>
                  <span className="text-slate-200 truncate">{selectedVessel.destination}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActivePage('vessel-ranking')}
              className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Examine Priority Score in Ranking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Active Oil Spill Profile */
          activeIncident && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Target Spill Slick
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {activeIncident.status}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-ocean-850 border border-ocean-750 space-y-2.5">
                <div>
                  <div className="text-xs font-mono text-slate-400">{activeIncident.incident_code}</div>
                  <div className="text-sm font-bold text-slate-100">{activeIncident.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-ocean-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ESTIMATED AREA</span>
                    <span className="text-rose-400 font-bold text-xs">{activeIncident.surface_area_km2.toFixed(2)} km²</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CFAR CONFIDENCE</span>
                    <span className="text-cyan-400 font-bold text-xs">{(activeIncident.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SENSOR / PLATFORM</span>
                    <span className="text-slate-200 text-[10px]">{activeIncident.satellite_platform} (C-SAR)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">COASTAL DISTANCE</span>
                    <span className="text-slate-200">{activeIncident.distance_to_coast_km} km</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-ocean-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Reviewer Notes:</span>
                  {activeIncident.notes || 'Under active multi-criteria correlation.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setActivePage('vessel-ranking')}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-ocean-glow"
                >
                  <Compass className="w-4 h-4" />
                  <span>Rank Corridor Vessels</span>
                </button>

                <button
                  onClick={() => setActivePage('trajectory-prediction')}
                  className="w-full py-2 px-3 rounded-lg bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Wind className="w-4 h-4 text-teal-400" />
                  <span>Simulate Drift Trajectory</span>
                </button>

                <button
                  onClick={() => setActivePage('route-investigation')}
                  className="w-full py-2 px-3 rounded-lg bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>Historical Route Replay</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Vessel Filter List */}
        <div className="p-4 border-t border-ocean-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Filter Vessel Types</span>
            <span className="text-[10px] font-mono text-cyan-400">{filteredVessels.length} shown</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {['All', 'Tanker', 'Container', 'Bulk', 'Tug'].map(type => (
              <button
                key={type}
                onClick={() => setVesselFilter(type)}
                className={`px-2.5 py-1.5 rounded-md border text-center transition-all ${
                  vesselFilter === type
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-ocean-850 text-slate-400 border-ocean-750 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
