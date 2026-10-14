import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Compass,
  ArrowRight,
  Eye,
  Ship,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CandidateAssessment, Incident } from '../types';

export const VesselRanking: React.FC = () => {
  const { selectedIncidentId, setActivePage } = useApp();
  const [candidates, setCandidates] = useState<CandidateAssessment[]>([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAssessment | null>(null);
  const [sortField, setSortField] = useState<string>('priority_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        if (selectedIncidentId) {
          const inc = await api.getIncident(selectedIncidentId);
          setIncident(inc);
          const data = await api.getIncidentCandidates(selectedIncidentId);
          setCandidates(data.candidates);
          if (data.candidates.length > 0) {
            setSelectedCandidate(data.candidates[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching vessel candidates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [selectedIncidentId]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedCandidates = [...candidates].sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'vessel_name') {
      aVal = a.vessel?.name || '';
      bVal = b.vessel?.name || '';
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const filteredCandidates = sortedCandidates.filter(c => {
    const v = c.vessel;
    const matchSearch =
      search === '' ||
      (v && (v.name.toLowerCase().includes(search.toLowerCase()) || v.mmsi.includes(search)));
    const matchType = filterType === 'All' || (v && v.vessel_type.includes(filterType));
    return matchSearch && matchType;
  });

  const handleExportCSV = () => {
    if (incident) {
      window.open(`/api/reports/${incident.id}/export/csv`, '_blank');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">AI Multi-Factor Vessel Investigation Ranking</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Corroborated Priority Index
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating Spatio-Temporal Alignment, AIS Continuity, Course Vector Geometry, and Speed Kinematics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Mandatory Prominent Notice (Prompt Section 12) */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs shadow-sm flex items-start gap-3 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 uppercase tracking-wider font-mono text-[11px] block">
            Statutory Maritime Intelligence Notice:
          </strong>
          <span>
            "Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility. Results depend on data availability, model assumptions, and independent verification."
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate vessel or MMSI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-ocean-900 border border-ocean-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-ocean-900 border border-ocean-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="All">All Vessel Classes</option>
            <option value="Tanker">Tankers (Crude & Chemical)</option>
            <option value="Container">Container Vessels</option>
            <option value="Bulk">Bulk Carriers</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredCandidates.length}</span> ranked candidates for {incident?.incident_code || 'OG-2026-0881'}
        </div>
      </div>

      {/* Main Ranking Table & Evidence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ocean-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-2 text-center">Rank</th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('vessel_name')}>
                    <div className="flex items-center gap-1">
                      <span>Vessel Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('temporal_score')}>
                    <span>Time (30%)</span>
                  </th>
                  <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('spatial_score')}>
                    <span>Dist (25%)</span>
                  </th>
                  <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('route_score')}>
                    <span>Route (20%)</span>
                  </th>
                  <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('priority_score')}>
                    <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold">
                      <span>Priority Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-800/60 font-mono">
                {filteredCandidates.map(c => {
                  const isSelected = selectedCandidate?.id === c.id;
                  const v = c.vessel;

                  let scoreBadgeColor = 'bg-slate-800 text-slate-300';
                  if (c.priority_score >= 70) scoreBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  else if (c.priority_score >= 45) scoreBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  else scoreBadgeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-ocean-850/60 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-2 text-center font-bold text-slate-200">
                        #{c.priority_rank}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100 font-sans">{v?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">MMSI: {v?.mmsi}</div>
                      </td>
                      <td className="py-3 px-2 text-[11px] font-sans text-slate-400 truncate max-w-[100px]">
                        {v?.vessel_type}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        {c.temporal_score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        {c.spatial_score}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        {c.route_score}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border font-mono ${scoreBadgeColor}`}>
                          {c.priority_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          c.review_status === 'Priority Inquiry'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-ocean-800 text-slate-300 border-ocean-700'
                        }`}>
                          {c.review_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evidence Breakdown Drawer (Right Column) */}
        <div className="space-y-6">
          {selectedCandidate ? (
            <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
              <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400">RANK #{selectedCandidate.priority_rank} CANDIDATE</div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedCandidate.vessel?.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono block">Composite Score</span>
                  <span className="text-lg font-extrabold text-cyan-400 font-mono">{selectedCandidate.priority_score} / 100</span>
                </div>
              </div>

              {/* Factor Score Radar Summary */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block">TEMPORAL FIT (30%)</span>
                  <span className="font-bold text-slate-200">{selectedCandidate.temporal_score} pts</span>
                </div>
                <div className="p-2 rounded bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block">SPATIAL CPA (25%)</span>
                  <span className="font-bold text-slate-200">{selectedCandidate.spatial_score} pts</span>
                </div>
                <div className="p-2 rounded bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block">ROUTE VECTOR (20%)</span>
                  <span className="font-bold text-slate-200">{selectedCandidate.route_score} pts</span>
                </div>
                <div className="p-2 rounded bg-ocean-850 border border-ocean-800">
                  <span className="text-[10px] text-slate-400 block">SPEED ANOMALY (15%)</span>
                  <span className="font-bold text-slate-200">{selectedCandidate.speed_anomaly_score} pts</span>
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-1.5 pt-2 border-t border-ocean-800">
                <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  Supporting Corroborating Factors:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 pl-4 list-disc">
                  {selectedCandidate.supporting_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Contradictory Evidence */}
              <div className="space-y-1.5 pt-2 border-t border-ocean-800">
                <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Contradictory / Exculpatory Evidence:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 pl-4 list-disc">
                  {selectedCandidate.contradictory_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Evidence & Data Gaps */}
              <div className="space-y-1.5 pt-2 border-t border-ocean-800">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Missing Evidence & Telemetry Gaps:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-400 pl-4 list-disc">
                  {selectedCandidate.missing_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Verification Steps */}
              <div className="space-y-1.5 pt-2 border-t border-ocean-800">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Recommended Authority Verification Steps:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 pl-4 list-disc">
                  {selectedCandidate.verification_steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>

              {/* Action Shortcut */}
              <button
                onClick={() => setActivePage('ocean-map')}
                className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-ocean-glow"
              >
                <span>Plot Track Over Slick on Ocean Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-ocean-900 border border-ocean-800 text-center text-slate-400 text-xs">
              Select a vessel from the ranking table to inspect evidence breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
