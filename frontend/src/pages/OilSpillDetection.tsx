import React, { useState } from 'react';
import {
  Scan,
  Sliders,
  Play,
  RotateCcw,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const OilSpillDetection: React.FC = () => {
  const { setActivePage } = useApp();
  const [selectedPreset, setSelectedPreset] = useState<string>('malacca_strait');
  const [sensitivity, setSensitivity] = useState<number>(0.5);
  const [polarization, setPolarization] = useState<string>('VV');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const presets = [
    {
      id: 'malacca_strait',
      name: 'Straits of Malacca TSS',
      satellite: 'Sentinel-1A C-SAR IW',
      sceneId: 'S1A_IW_GRDH_1SDV_20261012T024510',
      windSpeed: '5.2 m/s',
      desc: 'High traffic density shipping lane; C-band VV radar backscatter pass.'
    },
    {
      id: 'gulf_of_mexico',
      name: 'Gulf of Mexico (Mississippi Canyon)',
      satellite: 'Sentinel-1B C-SAR IW',
      sceneId: 'S1B_IW_GRDH_1SDV_20261010T115200',
      windSpeed: '3.8 m/s',
      desc: 'Outer Continental Shelf deepwater sector with nearby natural seep features.'
    },
    {
      id: 'celtic_sea',
      name: 'Celtic Sea (Western Approaches)',
      satellite: 'Sentinel-1A C-SAR IW',
      sceneId: 'S1A_IW_GRDH_1SDV_20261008T182015',
      windSpeed: '7.4 m/s',
      desc: 'Open shelf waters with high wind clutter suppression; prominent dark formation.'
    }
  ];

  const handleRunDetection = async () => {
    try {
      setIsProcessing(true);
      const res = await api.analyzeSatelliteScene(selectedPreset, sensitivity, polarization);
      setDetectionResult(res);
    } catch (err) {
      console.error('Error running detection:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ocean-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Satellite SAR Oil Slick Detection Workspace</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Sentinel-1 Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Adaptive CFAR & Multi-Scale Thresholding for Radar Backscatter Damping Feature Extraction
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-ocean-glow shrink-0 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>PROCESSING RADAR TENSOR...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RUN DETECTION PIPELINE</span>
            </>
          )}
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Settings & Radar Presets */}
        <div className="space-y-6">
          {/* Preset Selector */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan-400" />
              1. Satellite Observation Scene
            </h3>

            <div className="space-y-2.5">
              {presets.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPreset === p.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-slate-100 shadow-sm'
                      : 'bg-ocean-850 border-ocean-800 text-slate-400 hover:text-slate-200 hover:border-ocean-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{p.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{p.windSpeed}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">{p.sceneId}</div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Model Calibration Parameters */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              2. Segmentation Tuning
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>CFAR Threshold Sensitivity</span>
                  <span className="font-mono text-cyan-400">{(sensitivity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={sensitivity}
                  onChange={e => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Higher sensitivity detects fainter sheen; lower sensitivity reduces look-alike false alarms.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  SAR Polarization Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['VV (Co-Polarized)', 'VH (Cross-Polarized)'].map(pol => {
                    const val = pol.split(' ')[0];
                    return (
                      <button
                        key={val}
                        onClick={() => setPolarization(val)}
                        className={`py-1.5 px-2 rounded-md border text-center transition-all ${
                          polarization === val
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                            : 'bg-ocean-850 text-slate-400 border-ocean-800 hover:text-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-ocean-850 border border-ocean-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>Filter: <span className="text-slate-200">Enhanced Lee (5×5 window)</span></div>
                <div>Band: <span className="text-slate-200">C-Band (5.405 GHz)</span></div>
                <div>Pixel Size: <span className="text-slate-200">10.0m Ground Resolution</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Visual Synthetic Canvas & Segmentation Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Radar Raster Preview & Mask Canvas */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  SAR Backscatter Amplitude & Segmentation Mask Overlay
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sigma Nought (σ°) backscatter map showing dampening effect on capillary sea waves
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-ocean-800 text-slate-300 border border-ocean-700">
                10m/px GSD
              </span>
            </div>

            {/* Simulated Radar Image Display */}
            <div className="relative w-full h-80 rounded-lg bg-ocean-950 border border-ocean-800 overflow-hidden flex items-center justify-center group">
              {/* Radar Grid and Concentric Rings */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
              
              {/* Synthetic Radar Texture */}
              <div className="absolute inset-0 bg-gradient-to-tr from-ocean-950 via-slate-900 to-ocean-950 opacity-90"></div>

              {/* Synthetic Oil Slick Dark Patch */}
              <div
                className={`relative w-64 h-36 rounded-[45%] bg-ocean-950/90 border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)] rotate-[35deg] flex items-center justify-center transition-all duration-700 ${
                  detectionResult ? 'scale-105 opacity-100' : 'scale-100 opacity-60'
                }`}
              >
                <div className="text-center font-mono text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    DARK ANOMALY
                  </div>
                  <div className="text-[10px] text-slate-400">Damping: 8.4 dB</div>
                  <div className="text-[10px] text-cyan-400">Area: ~4.65 km²</div>
                </div>
              </div>

              {/* Sweep Line Animation */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
              </div>

              {/* Watermark Details */}
              <div className="absolute bottom-3 left-3 bg-ocean-950/80 backdrop-blur-sm px-2.5 py-1.5 rounded border border-ocean-800 text-[10px] font-mono text-slate-400 space-y-0.5">
                <div>SCENE: {selectedPreset.toUpperCase()}</div>
                <div>POLARIZATION: {polarization} | IW GRD</div>
              </div>
            </div>
          </div>

          {/* Analytical Inspection Cards (Once processed or default demonstration) */}
          <div className="p-5 rounded-xl bg-ocean-900 border border-ocean-800 shadow-panel space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Segmentation Metrics & Look-Alike Assessment
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Calculated Area</span>
                <span className="text-base font-bold text-rose-400">
                  {detectionResult ? `${detectionResult.estimated_total_area_km2} km²` : '4.65 km²'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Damping Ratio</span>
                <span className="text-base font-bold text-cyan-400">8.4 dB</span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">CFAR Confidence</span>
                <span className="text-base font-bold text-teal-400">
                  {detectionResult ? `${(detectionResult.mean_confidence * 100).toFixed(0)}%` : '88%'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800">
                <span className="text-[10px] text-slate-400 block uppercase">Look-Alike Risk</span>
                <span className="text-base font-bold text-amber-400">
                  {detectionResult ? `${(detectionResult.look_alike_probability * 100).toFixed(0)}%` : '12%'}
                </span>
              </div>
            </div>

            {/* Look-Alike Reasoning Callout */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Look-Alike Feature Discrimination:
              </div>
              <p className="text-[11px] text-slate-300">
                {detectionResult?.look_alike_reason ||
                  'Moderate wind (5.2 m/s) provides good sea clutter contrast; low probability of biogenic film due to sharp continuous linear edges and damping above 8 dB.'}
              </p>
            </div>

            {/* Limitations Notice */}
            <div className="p-3 rounded-lg bg-ocean-850 border border-ocean-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Scientific Limitations:</span>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Confidence score reflects dark-spot geometric fit, NOT chemical petroleum verification.</li>
                <li>Oil film thickness and volumetric discharge cannot be determined solely from single-frequency SAR.</li>
              </ul>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActivePage('ocean-map')}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>View Polygon on Ocean Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActivePage('vessel-ranking')}
                className="px-4 py-2 rounded-lg bg-ocean-800 hover:bg-ocean-750 border border-ocean-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Proceed to Vessel Ranking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
