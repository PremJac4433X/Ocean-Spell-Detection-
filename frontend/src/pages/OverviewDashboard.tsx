import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Ship,
  Scan,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardSummary } from '../types';

export const OverviewDashboard: React.FC = () => {
  const { setActivePage, setSelectedIncidentId } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-cyan-400 font-mono text-sm">
          <Activity className="w-8 h-8 animate-spin" />
          <span>INITIALIZING MARITIME INTELLIGENCE STREAM...</span>
        </div>
      </div>
    );
  }

  const confidencePieData = [
    { name: 'High (>85%)', value: summary.detection_confidence_distribution['High (>85%)'] || 1, color: '#f43f5e' },
    { name: 'Moderate (70-85%)', value: summary.detection_confidence_distribution['Moderate (70-85%)'] || 1, color: '#f59e0b' },
    { name: 'Low (<70%)', value: summary.detection_confidence_distribution['Low (<70%)'] || 0, color: '#06b6d4' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Notice Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-ocean-850 to-ocean-900 border border-cyan-500/30 flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
          <div>
            <span className="font-semibold text-cyan-300">DEMONSTRATION SURVEILLANCE FEED: </span>
            <span className="text-slate-300">{summary.system_notice}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Observation: {summary.latest_satellite_time}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Spill Candidates */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel relative overflow-hidden group hover:border-spill-red/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Slicks Detected</span>
            <div className="w-8 h-8 rounded-lg bg-spill-red/10 border border-spill-red/30 flex items-center justify-center text-spill-red">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{summary.total_spill_candidates}</span>
            <span className="text-xs text-rose-400 font-medium">12.47 km² active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-ocean-800 pt-2 font-mono">
            <span>Verified: <strong className="text-slate-200">{summary.verified_incidents}</strong></span>
            <span>Under Review: <strong className="text-amber-400">{summary.unverified_detections}</strong></span>
          </div>
        </div>

        {/* Card 2: Vessels in Area */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Vessels in Corridor</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{summary.vessels_in_observation_area}</span>
            <span className="text-xs text-cyan-400 font-medium">AIS Live</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-ocean-800 pt-2 font-mono">
            <span>Intersecting Corridor: <strong className="text-amber-400">{summary.vessels_intersecting_corridor}</strong></span>
            <span>Traffic Lane: <strong className="text-teal-400">TSS East</strong></span>
          </div>
        </div>

        {/* Card 3: Priority Investigations */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Active Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{summary.active_investigations}</span>
            <span className="text-xs text-amber-400 font-medium">1 High Priority Target</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-ocean-800 pt-2 font-mono">
            <span>Discretionary Score: <strong className="text-slate-200">82.4/100</strong></span>
            <span>Status: <strong className="text-cyan-400">Underway</strong></span>
          </div>
        </div>

        {/* Card 4: Environmental Threats */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel relative overflow-hidden group hover:border-red-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Environmental Risk</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{summary.environmental_alerts_active}</span>
            <span className="text-xs text-rose-400 font-medium">High Exposure Risk</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-ocean-800 pt-2 font-mono">
            <span>Closest MPA: <strong className="text-slate-200">8.5 km</strong></span>
            <span>Drift ETA: <strong className="text-amber-400">18.5h</strong></span>
          </div>
        </div>
      </div>

      {/* Charts Section: Trends & Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spill Area Trend */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Detected Spill Area & Frequency Trend
              </h3>
              <p className="text-[11px] text-slate-400">Aggregate surface area (km²) over 7-day observation cycle</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-ocean-800 text-cyan-400 border border-ocean-700">
              Sentinel-1 SAR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.spill_area_trend}>
                <defs>
                  <linearGradient id="spillAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit=" km²" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1633', borderColor: '#1b336e', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="area_km2" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#spillAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution Donut */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Detection Confidence Spectrum
            </h3>
            <p className="text-[11px] text-slate-400">CFAR segmentation certainty classification</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidencePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {confidencePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#070f22" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1633', borderColor: '#1b336e', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {confidencePieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-mono font-semibold">{item.value} scenes</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Scan className="w-4 h-4 text-rose-400" />
              Recent Oil Spill Detections & Verified Incidents
            </h3>
            <p className="text-[11px] text-slate-400">Click any incident to inspect its comprehensive intelligence profile</p>
          </div>
          <button
            onClick={() => setActivePage('incident-management')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>Manage All Incidents</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ocean-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-2.5 px-3">Code / Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Estimated Area</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Satellite / Sensor</th>
                <th className="py-2.5 px-3">Reviewer</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800/60 font-mono">
              {summary.recent_incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-ocean-850/60 transition-colors group">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200 group-hover:text-cyan-300 font-sans">{inc.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inc.incident_code}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        inc.status === 'Verified'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {inc.latitude.toFixed(4)}°N, {inc.longitude.toFixed(4)}°E
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-semibold">
                    {inc.surface_area_km2.toFixed(2)} km²
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-ocean-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${inc.confidence_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] text-cyan-300 font-mono">
                        {(inc.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px] font-sans">
                    {inc.satellite_platform} ({inc.detection_method.split(' ')[0]})
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                    {inc.reviewer}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedIncidentId(inc.id);
                        setActivePage('ocean-map');
                      }}
                      className="px-2.5 py-1 rounded bg-ocean-800 hover:bg-cyan-500 hover:text-ocean-950 text-cyan-300 font-sans font-medium text-[11px] transition-all"
                    >
                      Inspect Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
