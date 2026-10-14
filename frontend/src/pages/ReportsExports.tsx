import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Ship,
  Shield,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const ReportsExports: React.FC = () => {
  const { selectedIncidentId } = useApp();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await api.getIncidentReport(selectedIncidentId || 'inc-malacca-01');
        setReport(data);
      } catch (err) {
        console.error('Error fetching incident report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedIncidentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (report?.incident?.incident_code) {
      window.open(`/api/reports/${selectedIncidentId || 'inc-malacca-01'}/export/csv`, '_blank');
    }
  };

  if (loading || !report) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-sm animate-pulse">
          COMPILING MARITIME INCIDENT DOSSIER & EVIDENCE MATRICES...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:bg-white print:text-black">
      {/* Title & Print/Download Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Incident Dossier & Evidence Export</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Official Briefing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized Maritime Intelligence Incident Report for Flag State Audits and Environmental Authorities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-2 transition-all shadow-ocean-glow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Formal Dossier Card */}
      <div className="max-w-4xl mx-auto bg-ocean-900 border border-ocean-800 rounded-xl p-8 shadow-panel space-y-6 print:border-none print:shadow-none print:bg-white print:text-slate-900 print:p-2">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-ocean-750 print:border-slate-300 pb-4">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase print:text-cyan-700">
              OCEAN GUARD AI — MARITIME INTELLIGENCE COMMAND
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 print:text-slate-900 mt-1 font-sans">
              INCIDENT INVESTIGATION & SOURCE ATTRIBUTION DOSSIER
            </h2>
            <div className="text-xs font-mono text-slate-400 mt-1">
              REPORT REF: <strong className="text-slate-200 print:text-black">{report.report_id}</strong> | GENERATED: {report.generated_at}
            </div>
          </div>
          <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 print:bg-rose-100 print:text-rose-800">
            {report.incident.status.toUpperCase()}
          </span>
        </div>

        {/* Section 1: Incident & Detection Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 print:text-cyan-800 font-bold border-b border-ocean-800 pb-1">
            1. SATELLITE DETECTION & PHYSICAL CHARACTERISTICS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">INCIDENT CODE</span>
              <span className="font-bold text-slate-200 print:text-black">{report.incident.incident_code}</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">COORDINATES</span>
              <span className="font-bold text-slate-200 print:text-black">{report.incident.coordinates}</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">ESTIMATED AREA</span>
              <span className="font-bold text-rose-400 print:text-rose-700">{report.incident.surface_area_km2}</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">CFAR CONFIDENCE</span>
              <span className="font-bold text-teal-400 print:text-teal-700">{report.incident.confidence_score}</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 print:text-slate-700 space-y-1">
            <div><strong>Sensor Platform:</strong> {report.incident.satellite_platform} ({report.incident.sensor_type})</div>
            <div><strong>Maritime Region:</strong> {report.incident.maritime_region} ({report.incident.distance_to_coast_km} km to nearest shore)</div>
            <div><strong>Assigned Reviewer:</strong> {report.incident.reviewer}</div>
            <div><strong>Reviewer Notes:</strong> {report.incident.analyst_notes}</div>
          </div>
        </div>

        {/* Section 2: Candidate Vessels Prioritization */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 print:text-cyan-800 font-bold border-b border-ocean-800 pb-1">
            2. CORRIDOR CANDIDATE VESSEL RANKINGS
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ocean-800 print:border-slate-300 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-2 px-2">Rank</th>
                <th className="py-2 px-2">Vessel Name</th>
                <th className="py-2 px-2">MMSI / Type</th>
                <th className="py-2 px-2">Flag</th>
                <th className="py-2 px-2 text-center">Score</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800/60 print:divide-slate-200 font-mono text-[11px]">
              {report.investigation_ranking.candidates.map((c: any) => (
                <tr key={c.rank} className="hover:bg-ocean-850/40">
                  <td className="py-2 px-2 font-bold text-slate-200 print:text-black">#{c.rank}</td>
                  <td className="py-2 px-2 font-bold font-sans text-slate-100 print:text-black">{c.vessel_name}</td>
                  <td className="py-2 px-2 text-slate-400">{c.mmsi} ({c.vessel_type})</td>
                  <td className="py-2 px-2 text-slate-300">{c.flag}</td>
                  <td className="py-2 px-2 text-center font-bold text-cyan-400 print:text-cyan-700">{c.priority_score}</td>
                  <td className="py-2 px-2 text-amber-400 font-sans">{c.review_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Evidence Matrix for Priority Candidate */}
        {report.investigation_ranking.candidates.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 print:text-cyan-800 font-bold border-b border-ocean-800 pb-1">
              3. EVIDENCE BREAKDOWN FOR PRIORITY INQUIRY #{report.investigation_ranking.candidates[0].rank} ({report.investigation_ranking.candidates[0].vessel_name})
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-ocean-850 print:bg-slate-50 border border-ocean-800 print:border-slate-200">
                <span className="font-bold text-teal-400 print:text-teal-800 block mb-1">Supporting Evidence:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 print:text-slate-700">
                  {report.investigation_ranking.candidates[0].supporting_evidence.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded bg-ocean-850 print:bg-slate-50 border border-ocean-800 print:border-slate-200">
                <span className="font-bold text-rose-400 print:text-rose-800 block mb-1">Contradictory / Exculpatory Factors:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 print:text-slate-700">
                  {report.investigation_ranking.candidates[0].contradictory_evidence.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Hydrodynamic Trajectory & Coastal Impact */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 print:text-cyan-800 font-bold border-b border-ocean-800 pb-1">
            4. DRIFT SIMULATION & ENVIRONMENTAL EXPOSURE
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">WIND FORCING</span>
              <span className="font-bold text-slate-200 print:text-black">{report.trajectory_simulation.wind_forcing}</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">OCEAN CURRENT</span>
              <span className="font-bold text-slate-200 print:text-black">{report.trajectory_simulation.ocean_current}</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">COASTAL ARRIVAL ETA</span>
              <span className="font-bold text-amber-400 print:text-amber-700">{report.trajectory_simulation.coastal_impact_eta_hours} Hours</span>
            </div>
            <div className="p-3 rounded bg-ocean-850 print:bg-slate-100 border border-ocean-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 block">CLOSEST SANCTUARY</span>
              <span className="font-bold text-teal-400 print:text-teal-700">Sisters' Islands (8.5 km)</span>
            </div>
          </div>
          <div className="text-xs text-slate-300 print:text-slate-700">
            <strong>Recommended Response Action:</strong> {report.environmental_impact.recommended_containment_action}
          </div>
        </div>

        {/* Section 5: Statutory Legal & Scientific Disclaimer */}
        <div className="p-4 rounded-lg bg-amber-500/10 print:bg-amber-50 border border-amber-500/30 print:border-amber-200 text-amber-300 print:text-amber-900 text-xs space-y-2">
          <strong className="block uppercase font-mono font-bold">Mandatory Statutory Notice:</strong>
          <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
            {report.legal_and_methodological_disclaimers.map((disc: string, idx: number) => (
              <li key={idx}>{disc}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
