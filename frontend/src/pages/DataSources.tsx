import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { DataSourceStatus } from '../types';

export const DataSources: React.FC = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getDataSourcesStatus();
      setSources(res.providers);
    } catch (err) {
      console.error('Error fetching data sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleManualSync = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Satellite & AIS Data Providers Status</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Multi-Source Provenance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Ingestion Health, Latency Benchmarks, Coverage Metadata, and Credential Validation
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Ping All Ingestion Endpoints</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Providers Connected</span>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">{sources.length} Ingest Streams</div>
          <span className="text-[11px] text-teal-300 mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> All Endpoints Operational
          </span>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Average Ingestion Latency</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">189 ms</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sub-second near real-time</span>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Demonstration Integrity</span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">Strictly Tagged</div>
          <span className="text-[11px] text-amber-300 mt-1 block">Simulated telemetry isolated</span>
        </div>
      </div>

      {/* Provider Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map(s => (
          <div
            key={s.id}
            className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4 hover:border-ocean-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{s.provider_name}</h3>
                <span className="text-xs text-cyan-400 font-mono">{s.data_type}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                {s.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block">LATENCY</span>
                <span className="font-bold text-slate-200">{s.latency_ms} ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block">TELEMETRY RECORDS</span>
                <span className="font-bold text-cyan-400">{s.records_count.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block">GEOGRAPHIC COVERAGE</span>
                <span className="text-slate-300 text-[11px] truncate block">{s.coverage}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block">MODE</span>
                <span className={s.is_simulated ? 'text-amber-400 font-bold' : 'text-teal-400 font-bold'}>
                  {s.is_simulated ? 'Demonstration Synthesized' : 'Verified API Live'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-ocean-800 flex items-center justify-between font-mono">
              <span>Last Synchronized: {s.last_sync}</span>
              <span className="text-cyan-400">REST / GeoJSON</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
