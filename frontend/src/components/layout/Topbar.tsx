import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronDown,
  Info,
  Radio,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Topbar: React.FC = () => {
  const {
    activeScenario,
    setActiveScenario,
    selectedIncidentId,
    setSelectedIncidentId,
    incidentsList,
    setIsDisclaimerOpen,
    refreshIncidents,
    isLoading
  } = useApp();

  const [timeUtc, setTimeUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIncident = incidentsList.find(i => i.id === selectedIncidentId) || incidentsList[0];

  return (
    <header className="h-16 bg-ocean-900 border-b border-ocean-800 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Left: Scenario Switcher & Active Incident */}
      <div className="flex items-center gap-4">
        {/* Demonstration Mode Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-ocean-850 border border-ocean-750 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[11px] font-mono text-cyan-300 font-medium">DEMO CORRIDOR</span>
        </div>

        {/* Scenario Selector */}
        <div className="flex items-center bg-ocean-950 p-0.5 rounded-lg border border-ocean-800 text-xs">
          <button
            onClick={() => setActiveScenario('malacca')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeScenario === 'malacca'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Straits of Malacca TSS
          </button>
          <button
            onClick={() => setActiveScenario('gom')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeScenario === 'gom'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gulf of Mexico (Deepwater)
          </button>
        </div>

        {/* Incident Badge */}
        {activeIncident && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-spill-dark/40 border border-spill-red/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-spill-alert animate-pulse"></span>
            <span className="font-mono text-rose-300 font-semibold">{activeIncident.incident_code}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-300 truncate max-w-[200px]">{activeIncident.name}</span>
          </div>
        )}
      </div>

      {/* Right: Live Telemetry, UTC clock, Disclaimer Modal Trigger */}
      <div className="flex items-center gap-3">
        {/* UTC Live Time */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-ocean-950/70 px-3 py-1.5 rounded-lg border border-ocean-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeUtc || 'SYNCHRONIZING...'}</span>
        </div>

        {/* Data Refresh Button */}
        <button
          onClick={() => refreshIncidents()}
          disabled={isLoading}
          title="Sync Telemetry"
          className="p-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Legal Disclaimer Pill */}
        <button
          onClick={() => setIsDisclaimerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Priority Scoring Notice</span>
        </button>
      </div>
    </header>
  );
};
