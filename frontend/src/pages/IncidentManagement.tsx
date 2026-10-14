import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Edit3,
  PlusCircle,
  FileText,
  Shield,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Incident } from '../types';

export const IncidentManagement: React.FC = () => {
  const { incidentsList, refreshIncidents, setActivePage, setSelectedIncidentId } = useApp();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (incidentsList.length > 0 && !selectedIncident) {
      const inc = incidentsList[0];
      setSelectedIncident(inc);
      setNewStatus(inc.status);
      setReviewerName(inc.reviewer);
      setNotes(inc.notes);
    }
  }, [incidentsList]);

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setReviewerName(inc.reviewer);
    setNotes(inc.notes);
    setSuccessMessage('');
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;
    try {
      setIsUpdating(true);
      await api.updateIncident(selectedIncident.id, {
        status: newStatus as any,
        reviewer: reviewerName,
        notes: notes
      });
      await refreshIncidents();
      setSuccessMessage('Incident record successfully updated & audit trail logged.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error updating incident:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Incident Management & Reviewer Lifecycle</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-Loop Review, Verification Actions, Reviewer Assignment, and Status Transition History
          </p>
        </div>

        <button
          onClick={() => setActivePage('reports-exports')}
          className="px-4 py-2 rounded-lg bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Export Incident Dossier</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Incident Selector Table + Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents Directory */}
        <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            Active Incident Registry ({incidentsList.length})
          </h3>

          <div className="space-y-2.5">
            {incidentsList.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              let statusBg = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
              if (inc.status === 'Verified') statusBg = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
              else if (inc.status === 'Response Active') statusBg = 'bg-teal-500/10 text-teal-300 border-teal-500/30';

              return (
                <div
                  key={inc.id}
                  onClick={() => handleSelectIncident(inc)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-slate-100 shadow-sm'
                      : 'bg-ocean-850 border-ocean-800 text-slate-400 hover:text-slate-200 hover:border-ocean-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span>{inc.incident_code}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBg}`}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-100 mt-1 font-sans">{inc.name}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-ocean-800">
                    <span>Area: {inc.surface_area_km2.toFixed(2)} km²</span>
                    <span>Conf: {(inc.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Review & Management Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="p-6 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-5">
              <div className="flex items-center justify-between border-b border-ocean-800 pb-4">
                <div>
                  <div className="text-xs font-mono text-cyan-400">{selectedIncident.incident_code}</div>
                  <h2 className="text-base font-bold text-slate-100">{selectedIncident.name}</h2>
                </div>
                <div className="text-right text-xs font-mono text-slate-400">
                  <div>Observed: {selectedIncident.observation_time}</div>
                  <div className="text-teal-400">{selectedIncident.satellite_platform} (C-SAR)</div>
                </div>
              </div>

              {/* Status Update Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Lifecycle Review Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full bg-ocean-850 border border-ocean-750 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Unverified">Unverified (Pending Validation)</option>
                    <option value="Under Review">Under Review (Analyst Review)</option>
                    <option value="Verified">Verified (Confirmed Oil Slick)</option>
                    <option value="Response Active">Response Active (Containment Deployed)</option>
                    <option value="Contained">Contained (Boom In Place)</option>
                    <option value="Closed">Closed (Incident Resolved)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Assigned Officer / Reviewer
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder="Enter reviewer name & title..."
                    className="w-full bg-ocean-850 border border-ocean-750 rounded-lg px-3 py-2 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Official Maritime Analyst Notes & Verification Findings
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record verification actions, cross-sensor optical correlation, radar clutter checks, port state inquiries..."
                  className="w-full bg-ocean-850 border border-ocean-750 rounded-lg p-3 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-ocean-800">
                <div className="text-[11px] font-mono text-slate-400">
                  Last Updated: {selectedIncident.updated_at}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedIncidentId(selectedIncident.id);
                      setActivePage('ocean-map');
                    }}
                    className="px-4 py-2 rounded-lg bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-slate-200 font-medium text-xs transition-colors"
                  >
                    Inspect Map
                  </button>

                  <button
                    onClick={handleUpdateIncident}
                    disabled={isUpdating}
                    className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center gap-2 transition-all shadow-ocean-glow disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>SAVING...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>UPDATE INCIDENT STATUS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-ocean-900 border border-ocean-800 text-center text-slate-400 text-xs">
              Select an incident from the registry to inspect or edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
