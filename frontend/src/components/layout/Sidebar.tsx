import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Scan,
  Ship,
  GitBranch,
  BarChart3,
  Wind,
  ShieldAlert,
  ClipboardList,
  Cpu,
  FileText,
  Database,
  Settings,
  Waves,
  AlertTriangle,
  Radio,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = useApp();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'ocean-map', label: 'Live Ocean Map', icon: MapPin, badge: 'Live GIS', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    { id: 'spill-detection', label: 'Oil Spill Detection', icon: Scan, badge: 'SAR AI', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'vessel-intelligence', label: 'Vessel Intelligence', icon: Ship },
    { id: 'route-investigation', label: 'Route Investigation', icon: GitBranch },
    { id: 'vessel-ranking', label: 'Vessel Ranking', icon: BarChart3, badge: 'AI Rank', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'trajectory-prediction', label: 'Trajectory Prediction', icon: Wind, badge: 'Drift', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    { id: 'environmental-impact', label: 'Environmental Impact', icon: ShieldAlert, badge: 'Alert', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' },
    { id: 'incident-management', label: 'Incident Management', icon: ClipboardList },
    { id: 'ai-analytics', label: 'AI Analytics', icon: Cpu },
    { id: 'reports-exports', label: 'Reports & Exports', icon: FileText },
    { id: 'data-sources', label: 'Data Sources', icon: Database },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-ocean-900 border-r border-ocean-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-ocean-800 gap-3 bg-ocean-950/60">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-ocean-glow">
          <Waves className="w-5 h-5 text-ocean-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-slate-100 text-sm">OCEAN GUARD</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">AI</span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wide font-mono">MARITIME SURVEILLANCE</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-300">
          Command Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-ocean-800 text-slate-300 border-ocean-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-ocean-800 bg-ocean-950/40">
        <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-750 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[10px]">RADAR TELEMETRY</span>
            <span className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Observation Window</span>
            <span className="font-mono text-cyan-400 text-[10px]">±12.0h UTC</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
