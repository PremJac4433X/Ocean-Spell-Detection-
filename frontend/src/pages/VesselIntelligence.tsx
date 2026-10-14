import React, { useState, useEffect } from 'react';
import {
  Ship,
  Search,
  Filter,
  Compass,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Vessel } from '../types';

export const VesselIntelligence: React.FC = () => {
  const { setActivePage } = useApp();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [vesselTracks, setVesselTracks] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        setLoading(true);
        const data = await api.getVessels();
        setVessels(data);
        if (data.length > 0) {
          setSelectedVessel(data[0]);
        }
      } catch (err) {
        console.error('Error fetching vessels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVessels();
  }, []);

  useEffect(() => {
    if (selectedVessel) {
      api.getVesselTracks(selectedVessel.id)
        .then(tracks => setVesselTracks(tracks))
        .catch(err => console.error('Error fetching vessel tracks:', err));
    }
  }, [selectedVessel]);

  const filteredVessels = vessels.filter(v => {
    const matchSearch =
      search === '' ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.mmsi.includes(search) ||
      v.imo.includes(search);
    const matchType = selectedType === 'All' || v.vessel_type.includes(selectedType);
    return matchSearch && matchType;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Vessel Intelligence & AIS Directory</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Live AIS Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Terrestrial & Satellite AIS Telemetry, Kinematic Profiles, and Identity Verification
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, MMSI, IMO..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-ocean-900 border border-ocean-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-ocean-900 border border-ocean-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="All">All Vessel Classes</option>
            <option value="Tanker">Crude & Chemical Tankers</option>
            <option value="Container">Container Carriers</option>
            <option value="Bulk">Bulk Carriers</option>
            <option value="Tug">Tugs & Offshore</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Vessel Table + Detailed Profile Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessel Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400" />
              Active Commercial Vessels in Monitored Sector ({filteredVessels.length})
            </span>
            <span className="text-[11px] font-mono text-slate-400">TSS Singapore Strait</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ocean-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Vessel Identity</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Speed / Course</th>
                  <th className="py-2.5 px-3">Flag</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-800/60 font-mono">
                {filteredVessels.map(v => {
                  const isSelected = selectedVessel?.id === v.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVessel(v)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-ocean-850/60 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200 font-sans">{v.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">MMSI: {v.mmsi} | IMO: {v.imo}</div>
                      </td>
                      <td className="py-3 px-3 text-[11px] font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          v.vessel_type.includes('Tanker')
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-ocean-800 text-slate-300 border-ocean-700'
                        }`}>
                          {v.vessel_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {v.speed_knots} kt @ {v.course_deg}°
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">
                        {v.flag}
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[120px]">
                        {v.destination}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVessel(v);
                          }}
                          className="px-2 py-1 rounded bg-ocean-800 hover:bg-cyan-500 hover:text-ocean-950 text-cyan-300 text-[10px] font-sans transition-all"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Selected Vessel Profile */}
        <div className="space-y-6">
          {selectedVessel ? (
            <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
              <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedVessel.name}</h3>
                  <span className="text-[10px] font-mono text-cyan-400">{selectedVessel.vessel_type}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {selectedVessel.nav_status}
                </span>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">MMSI</span>
                  <span className="text-slate-200">{selectedVessel.mmsi}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">IMO NUMBER</span>
                  <span className="text-slate-200">{selectedVessel.imo}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">DIMENSIONS</span>
                  <span className="text-slate-200">{selectedVessel.length_m}m × {selectedVessel.width_m}m</span>
                </div>
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">DRAUGHT</span>
                  <span className="text-slate-200">{selectedVessel.draught_m}m</span>
                </div>
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">LAST RECORDED SPEED</span>
                  <span className="text-cyan-400 font-bold">{selectedVessel.speed_knots} kt</span>
                </div>
                <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block uppercase">COURSE OVER GROUND</span>
                  <span className="text-cyan-400 font-bold">{selectedVessel.course_deg}°</span>
                </div>
              </div>

              {/* Historical Track Telemetry Log */}
              {vesselTracks && (
                <div className="space-y-2 pt-2 border-t border-ocean-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Historical AIS Track Points ({vesselTracks.points_count})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">12h Trajectory</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] font-mono">
                    {vesselTracks.positions.map((pt: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border flex items-center justify-between ${
                          pt.ais_gap_flag
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-ocean-850 border-ocean-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <span>{pt.latitude.toFixed(4)}°N, {pt.longitude.toFixed(4)}°E</span>
                          {pt.ais_gap_flag && (
                            <span className="text-[9px] ml-1.5 px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-sans">
                              GAP FLAGGED
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-200">{pt.speed_knots} kt</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setActivePage('route-investigation')}
                  className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-ocean-glow"
                >
                  <Compass className="w-4 h-4" />
                  <span>Inspect Route & Time Envelope</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-ocean-900 border border-ocean-800 text-center text-slate-400 text-xs">
              Select a vessel from the directory to inspect its technical profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
