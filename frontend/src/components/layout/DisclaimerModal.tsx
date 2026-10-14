import React from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, FileText, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DisclaimerModal: React.FC = () => {
  const { isDisclaimerOpen, setIsDisclaimerOpen } = useApp();

  if (!isDisclaimerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-ocean-900 border border-ocean-750 rounded-xl shadow-panel overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-800 bg-ocean-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Maritime Intelligence & Scoring Notice</h3>
              <p className="text-[11px] font-mono text-slate-400">DECISION-SUPPORT & INVESTIGATION METHODOLOGY</p>
            </div>
          </div>
          <button
            onClick={() => setIsDisclaimerOpen(false)}
            className="p-1 rounded-lg hover:bg-ocean-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300 max-h-[70vh] overflow-y-auto">
          {/* Main Primary Notice */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 leading-relaxed font-medium">
            "Rankings indicate investigation priority, not proof of an oil spill or vessel responsibility. Results depend on data availability, model assumptions, and independent verification."
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-100 font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Scientific & Operational Principles
            </h4>
            
            <div className="space-y-2.5 pl-6 border-l-2 border-ocean-800 text-slate-300">
              <div>
                <strong className="text-cyan-300">1. Prioritization vs. Accusation:</strong>
                <p className="mt-0.5 text-slate-400">
                  Scores calculated by the multi-criteria engine reflect spatio-temporal alignment with backtracked drift envelopes. They serve solely to optimize Maritime Authority inspection resources (e.g. PSC port audits), NEVER legal blame.
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">2. AIS Discontinuities:</strong>
                <p className="mt-0.5 text-slate-400">
                  Transmission gaps in Automatic Identification System (AIS) messages frequently occur due to VHF slot collision in high-density waterways, coastal antenna blind zones, or weather attenuation. A signal gap is NOT treated as prima facie evidence of deliberate transponder shutdown.
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">3. SAR Look-Alikes & Uncertainty:</strong>
                <p className="mt-0.5 text-slate-400">
                  C-band Synthetic Aperture Radar (SAR) dark features can stem from natural biogenic slicks (plankton/algal surfactants), calm sea conditions (wind &lt; 3 m/s), rain cells, or upwelling. Model confidence reflects pattern recognition, not chemical petroleum confirmation.
                </p>
              </div>

              <div>
                <strong className="text-cyan-300">4. Proximity Fallacy:</strong>
                <p className="mt-0.5 text-slate-400">
                  Vessels are not ranked on distance alone. Drift backtracking accounts for surface ocean currents and wind-induced leeway to reconstruct the origin corridor prior to satellite image acquisition.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-ocean-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Framework: UNCLOS Art. 218 & MARPOL 73/78 Annex I</span>
            <span>Version: 1.0 (Audit-Verified)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-ocean-950/60 border-t border-ocean-800 flex justify-end">
          <button
            onClick={() => setIsDisclaimerOpen(false)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-semibold text-xs transition-colors"
          >
            I Acknowledge & Understand
          </button>
        </div>
      </div>
    </div>
  );
};
