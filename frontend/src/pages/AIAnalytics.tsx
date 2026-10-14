import React from 'react';
import {
  Cpu,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Info,
  Radar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const AIAnalytics: React.FC = () => {
  // Feature discrimination data: Mineral Oil vs Biogenic vs Low-Wind Clutter
  const dampingData = [
    { dbRange: '2-4 dB', mineralOil: 5, biogenicFilm: 65, lowWind: 40 },
    { dbRange: '4-6 dB', mineralOil: 18, biogenicFilm: 25, lowWind: 30 },
    { dbRange: '6-8 dB', mineralOil: 45, biogenicFilm: 8, lowWind: 15 },
    { dbRange: '8-10 dB', mineralOil: 28, biogenicFilm: 2, lowWind: 10 },
    { dbRange: '>10 dB', mineralOil: 12, biogenicFilm: 0, lowWind: 5 },
  ];

  const falseAlarmReduction = [
    { threshold: '0.2', recall: 98, falseAlarm: 42 },
    { threshold: '0.4', recall: 95, falseAlarm: 24 },
    { threshold: '0.6', recall: 91, falseAlarm: 11 },
    { threshold: '0.8', recall: 84, falseAlarm: 4 },
    { threshold: '0.9', recall: 72, falseAlarm: 1 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">AI Model Analytics & SAR Feature Discrimination</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Deep Learning & CFAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discriminating Mineral Oil from Biogenic Surfactants, Wind Shadows, and Internal Waves
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-teal-400 bg-ocean-900 border border-ocean-800 px-3 py-1.5 rounded-lg">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>F1-Score: 0.892 (SAR Benchmark)</span>
        </div>
      </div>

      {/* Grid: 2 Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Damping Ratio Distribution */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Radar className="w-4 h-4 text-cyan-400" />
              Radar Backscatter Damping (dB) Distribution by Class
            </h3>
            <p className="text-[11px] text-slate-400">
              Mineral oil causes strong suppression of short Bragg waves (&gt;6 dB damping) compared to natural films.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dampingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dbRange" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1633', borderColor: '#1b336e', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="mineralOil" name="Crude/Heavy Oil" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="biogenicFilm" name="Biogenic Slick" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowWind" name="Low-Wind Clutter" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Recall vs False Alarm Mitigation Rate
            </h3>
            <p className="text-[11px] text-slate-400">
              Optimal operating point tuned at threshold 0.6 to minimize false alarms without missing thin slicks.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={falseAlarmReduction}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="threshold" stroke="#475569" fontSize={11} tickLine={false} label={{ value: 'CFAR Sensitivity Threshold', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1633', borderColor: '#1b336e', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="recall" name="True Detection Recall (%)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="falseAlarm" name="False Alarm Rate (%)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Matrix Deep Dive */}
      <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Discrimination Feature Weights & Physical Heuristics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-ocean-850 border border-ocean-800 space-y-2">
            <div className="font-bold text-slate-100 flex items-center justify-between font-sans">
              <span>Boundary Gradient Sharpness</span>
              <span className="text-cyan-400">Weight: 35%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Petroleum oil maintains high surface tension against seawater, causing abrupt backscatter transitions (&gt;4.5 dB/pixel). Biogenic films display gradual, fuzzy boundaries.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ocean-850 border border-ocean-800 space-y-2">
            <div className="font-bold text-slate-100 flex items-center justify-between font-sans">
              <span>Wind Clutter Context</span>
              <span className="text-cyan-400">Weight: 30%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              When wind speeds drop below 3.0 m/s, specular reflection darkens the entire radar scene. Slicks are only valid within ambient wind speeds between 3.0 and 12.0 m/s.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ocean-850 border border-ocean-800 space-y-2">
            <div className="font-bold text-slate-100 flex items-center justify-between font-sans">
              <span>Geometric Elongation Ratio</span>
              <span className="text-cyan-400">Weight: 25%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Operational discharges from transiting vessels form characteristic elongated tails aligned with shipping lanes, whereas natural seeps originate from stationary seabed vents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
