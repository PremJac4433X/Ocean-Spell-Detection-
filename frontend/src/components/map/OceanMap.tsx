import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Layers,
  Ship,
  AlertTriangle,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Incident, Vessel, TrajectorySimulationResult, EnvironmentalAsset } from '../../types';

interface OceanMapProps {
  incidents: Incident[];
  vessels: Vessel[];
  selectedIncident?: Incident;
  selectedVessel?: Vessel;
  onSelectIncident?: (incident: Incident) => void;
  onSelectVessel?: (vessel: Vessel) => void;
  trajectory?: TrajectorySimulationResult | null;
  environmentalAssets?: EnvironmentalAsset[];
  initialCenter?: [number, number]; // [lon, lat]
  initialZoom?: number;
  showTimelineControls?: boolean;
}

export const OceanMap: React.FC<OceanMapProps> = ({
  incidents,
  vessels,
  selectedIncident,
  selectedVessel,
  onSelectIncident,
  onSelectVessel,
  trajectory,
  environmentalAssets = [],
  initialCenter = [103.7850, 1.2580], // Malacca default
  initialZoom = 10,
  showTimelineControls = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Token & Error Handling States
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Layer Visibility States
  const [layers, setLayers] = useState({
    spills: true,
    vessels: true,
    tracks: true,
    routes: true,
    trajectory: true,
    uncertaintyCone: true,
    protectedAreas: true,
    satelliteFootprint: true,
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineStep, setTimelineStep] = useState<number>(0);

  // Initialize Mapbox GL Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 1. Read Mapbox Access Token from Vite environment variable
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() || '';

    // 2. Validate token presence before initialization
    if (!token) {
      setMapError('Missing Mapbox API Token: VITE_MAPBOX_ACCESS_TOKEN is not defined in .env.');
      return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = token;

    try {
      // 3. Initialize Mapbox Map with dark tactical style
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      map.current = m;

      // Add navigation controls (zoom & 3D compass pitch/bearing)
      m.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
      m.addControl(new mapboxgl.ScaleControl({ unit: 'nautical' }), 'bottom-left');

      // Listen for Mapbox authorization or tile errors
      m.on('error', (e) => {
        const errorMsg = e.error?.message || '';
        const statusCode = (e.error as any)?.status;

        if (statusCode === 401 || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('forbidden')) {
          setMapError('Mapbox Authorization Failed: The access token was rejected or does not have permissions for this style.');
        } else if (errorMsg.toLowerCase().includes('not found') && errorMsg.toLowerCase().includes('style')) {
          setMapError('Mapbox Style Error: Unable to load requested map style.');
        }
      });

      m.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        m.resize();
      });

    } catch (err: any) {
      setMapError(`Map initialization failure: ${err?.message || 'Unable to instantiate Mapbox GL map.'}`);
    }

    // Resize observer to ensure map canvas fits dynamic layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Center update when selectedIncident changes
  useEffect(() => {
    if (map.current && selectedIncident) {
      map.current.flyTo({
        center: [selectedIncident.longitude, selectedIncident.latitude],
        zoom: 11,
        speed: 1.2,
      });
    }
  }, [selectedIncident]);

  // Load and Render Dynamic Vector Layers (Spills, Trajectory, MPAs, Shipping lanes)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    const setupLayers = () => {
      // 1. Shipping Separation Scheme (TSS) lanes (Malacca Strait example)
      if (!m.getSource('shipping-lanes')) {
        const tssGeoJson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'TSS Eastbound Traffic Lane' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [103.4500, 1.3600],
                  [103.6000, 1.3050],
                  [103.7500, 1.2450],
                  [103.9000, 1.1850],
                  [104.0500, 1.1400]
                ]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'TSS Westbound Traffic Lane' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [104.0500, 1.1700],
                  [103.9000, 1.2150],
                  [103.7500, 1.2750],
                  [103.6000, 1.3350],
                  [103.4500, 1.3900]
                ]
              }
            }
          ]
        };

        m.addSource('shipping-lanes', { type: 'geojson', data: tssGeoJson });
        m.addLayer({
          id: 'shipping-lanes-line',
          type: 'line',
          source: 'shipping-lanes',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 2,
            'line-dasharray': [3, 2],
            'line-opacity': 0.45
          }
        });
      }

      // 2. Oil Spill Polygons
      const spillFeatures: GeoJSON.Feature[] = incidents.map(inc => ({
        type: 'Feature',
        properties: {
          id: inc.id,
          code: inc.incident_code,
          name: inc.name,
          area: inc.surface_area_km2,
          confidence: inc.confidence_score,
          severity: inc.severity,
          status: inc.status
        },
        geometry: inc.geometry_geojson || {
          type: 'Point',
          coordinates: [inc.longitude, inc.latitude]
        }
      }));

      if (m.getSource('spill-source')) {
        (m.getSource('spill-source') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: spillFeatures
        });
      } else {
        m.addSource('spill-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: spillFeatures }
        });

        // Polygon Fill
        m.addLayer({
          id: 'spill-fill',
          type: 'fill',
          source: 'spill-source',
          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.4
          }
        });

        // Polygon Glow Stroke
        m.addLayer({
          id: 'spill-stroke',
          type: 'line',
          source: 'spill-source',
          paint: {
            'line-color': '#f43f5e',
            'line-width': 2.5
          }
        });

        // Click on spill polygon selects incident
        m.on('click', 'spill-fill', (e) => {
          if (e.features && e.features[0] && onSelectIncident) {
            const featId = e.features[0].properties?.id;
            const inc = incidents.find(i => i.id === featId);
            if (inc) onSelectIncident(inc);
          }
        });
      }

      // 3. Marine Protected Areas (MPAs)
      if (environmentalAssets.length > 0) {
        const mpaFeatures: GeoJSON.Feature[] = environmentalAssets.map(ea => ({
          type: 'Feature',
          properties: {
            id: ea.id,
            name: ea.name,
            type: ea.asset_type,
            esi: ea.vulnerability_index,
            risk: ea.exposure_risk
          },
          geometry: ea.geometry_geojson || {
            type: 'Point',
            coordinates: [ea.longitude, ea.latitude]
          }
        }));

        if (m.getSource('mpa-source')) {
          (m.getSource('mpa-source') as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: mpaFeatures
          });
        } else {
          m.addSource('mpa-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: mpaFeatures }
          });

          m.addLayer({
            id: 'mpa-fill',
            type: 'fill',
            source: 'mpa-source',
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.25
            }
          });

          m.addLayer({
            id: 'mpa-stroke',
            type: 'line',
            source: 'mpa-source',
            paint: {
              'line-color': '#10b981',
              'line-width': 1.5,
              'line-dasharray': [2, 1]
            }
          });
        }
      }

      // 4. Uncertainty Cone from Trajectory
      if (trajectory?.uncertainty_cone_geojson) {
        if (m.getSource('trajectory-cone-source')) {
          (m.getSource('trajectory-cone-source') as mapboxgl.GeoJSONSource).setData(trajectory.uncertainty_cone_geojson);
        } else {
          m.addSource('trajectory-cone-source', {
            type: 'geojson',
            data: trajectory.uncertainty_cone_geojson
          });

          m.addLayer({
            id: 'trajectory-cone-fill',
            type: 'fill',
            source: 'trajectory-cone-source',
            paint: {
              'fill-color': '#f59e0b',
              'fill-opacity': 0.18
            }
          });

          m.addLayer({
            id: 'trajectory-cone-stroke',
            type: 'line',
            source: 'trajectory-cone-source',
            paint: {
              'line-color': '#f59e0b',
              'line-width': 1.5,
              'line-dasharray': [4, 2]
            }
          });
        }
      }
    };

    if (m.isStyleLoaded()) {
      setupLayers();
    } else {
      m.once('load', setupLayers);
    }
  }, [incidents, environmentalAssets, trajectory, mapLoaded]);

  // Render Interactive Vessel Markers on Mapbox
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!layers.vessels) return;

    vessels.forEach(v => {
      // Find coordinates: use recent position or base coords
      // Mock / base coords around Malacca TSS for demonstration vessels
      const coords: [number, number] = [
        103.7500 + (parseInt(v.mmsi.slice(-3)) % 20 - 10) * 0.03,
        1.2400 + (parseInt(v.mmsi.slice(-2)) % 20 - 10) * 0.015
      ];

      const isSelected = selectedVessel?.id === v.id;

      // Create Custom Vessel Marker DOM element
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center transition-transform hover:scale-125';
      el.style.width = '32px';
      el.style.height = '32px';

      el.innerHTML = `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${
          isSelected
            ? 'bg-cyan-500/30 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50'
            : 'bg-ocean-900/90 hover:bg-ocean-800 ring-1 ring-cyan-500/40'
        } transition-all">
          <svg style="transform: rotate(${v.course_deg || 0}deg)" class="w-4 h-4 ${
            isSelected ? 'text-cyan-200' : 'text-cyan-400'
          }" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 20l8-4 8 4L12 2z"/>
          </svg>
        </div>
        <div class="hidden group-hover:block absolute bottom-9 whitespace-nowrap bg-ocean-950/95 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded shadow-lg z-50">
          ${v.name} (${v.speed_knots}kt)
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectVessel) onSelectVessel(v);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

  }, [vessels, selectedVessel, layers.vessels, mapLoaded]);

  // Layer visibility toggling
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    const m = map.current;

    if (m.getLayer('spill-fill')) m.setLayoutProperty('spill-fill', 'visibility', layers.spills ? 'visible' : 'none');
    if (m.getLayer('spill-stroke')) m.setLayoutProperty('spill-stroke', 'visibility', layers.spills ? 'visible' : 'none');
    if (m.getLayer('shipping-lanes-line')) m.setLayoutProperty('shipping-lanes-line', 'visibility', layers.routes ? 'visible' : 'none');
    if (m.getLayer('mpa-fill')) m.setLayoutProperty('mpa-fill', 'visibility', layers.protectedAreas ? 'visible' : 'none');
    if (m.getLayer('mpa-stroke')) m.setLayoutProperty('mpa-stroke', 'visibility', layers.protectedAreas ? 'visible' : 'none');
    if (m.getLayer('trajectory-cone-fill')) m.setLayoutProperty('trajectory-cone-fill', 'visibility', layers.uncertaintyCone ? 'visible' : 'none');
    if (m.getLayer('trajectory-cone-stroke')) m.setLayoutProperty('trajectory-cone-stroke', 'visibility', layers.uncertaintyCone ? 'visible' : 'none');
  }, [layers, mapLoaded]);

  // Timeline Auto-Play Loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineStep(prev => (prev >= 8 ? 0 : prev + 1));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleRetryMap = () => {
    setMapError(null);
    window.location.reload();
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex overflow-hidden rounded-xl border border-ocean-800 bg-ocean-950">
      {/* Mapbox Canvas Container */}
      <div ref={mapContainer} className="w-full h-full min-h-[500px]" />

      {/* Mapbox Error Overlay if Token Missing or Rejected */}
      {mapError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-ocean-950/90 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-xl bg-ocean-900 border border-rose-500/40 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Mapbox Initialization Issue</h3>
              <p className="text-xs text-rose-300 font-mono mt-1.5 break-words">{mapError}</p>
            </div>
            <div className="p-3 rounded-lg bg-ocean-950 border border-ocean-800 text-[11px] font-mono text-slate-300 text-left space-y-1">
              <div>Expected Variable: <span className="text-cyan-400">VITE_MAPBOX_ACCESS_TOKEN</span></div>
              <div>Location: <span className="text-teal-300">frontend/.env</span></div>
            </div>
            <button
              onClick={handleRetryMap}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Mapbox Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Layer Controls (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-ocean-900/90 backdrop-blur-md border border-ocean-750 p-2.5 rounded-lg shadow-panel space-y-2 text-xs w-48 select-none">
          <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-ocean-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              GIS Map Layers
            </span>
            <span className="text-[10px] font-mono text-cyan-400">MAPBOX</span>
          </div>

          <div className="space-y-1">
            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Oil Spill Polygons
              </span>
              <input
                type="checkbox"
                checked={layers.spills}
                onChange={e => setLayers({ ...layers, spills: e.target.checked })}
                className="rounded border-ocean-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                AIS Vessels ({vessels.length})
              </span>
              <input
                type="checkbox"
                checked={layers.vessels}
                onChange={e => setLayers({ ...layers, vessels: e.target.checked })}
                className="rounded border-ocean-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Drift Uncertainty Cone
              </span>
              <input
                type="checkbox"
                checked={layers.uncertaintyCone}
                onChange={e => setLayers({ ...layers, uncertaintyCone: e.target.checked })}
                className="rounded border-ocean-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Marine Protected Areas
              </span>
              <input
                type="checkbox"
                checked={layers.protectedAreas}
                onChange={e => setLayers({ ...layers, protectedAreas: e.target.checked })}
                className="rounded border-ocean-700 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                TSS Shipping Lanes
              </span>
              <input
                type="checkbox"
                checked={layers.routes}
                onChange={e => setLayers({ ...layers, routes: e.target.checked })}
                className="rounded border-ocean-700 text-cyan-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Legend Box */}
        <div className="bg-ocean-900/90 backdrop-blur-md border border-ocean-750 p-2.5 rounded-lg shadow-panel text-[11px] space-y-1.5 w-48 text-slate-300 select-none">
          <div className="font-semibold text-slate-200 text-xs border-b border-ocean-800 pb-1 flex items-center justify-between">
            <span>Legend & Risk Key</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/80 border border-rose-400"></span>
            <span>Spill Detections (SAR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-400 border-dashed"></span>
            <span>90% Dispersion Cone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/50 border border-emerald-400"></span>
            <span>Critical Habitat / MPA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Vessel AIS Telemetry</span>
          </div>
        </div>
      </div>

      {/* Floating Timeline Controls (Bottom Center) */}
      {showTimelineControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-ocean-900/95 backdrop-blur-md border border-ocean-750 px-4 py-2.5 rounded-xl shadow-panel flex items-center gap-4 text-xs select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold transition-colors"
              title={isPlaying ? 'Pause Replay' : 'Play Historical Track Replay'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => setTimelineStep(0)}
              className="p-1.5 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-slate-300 transition-colors"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 w-64">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span className="text-cyan-400 font-semibold">T - {(8 - timelineStep * 1.0).toFixed(1)}h UTC</span>
              <span className="text-slate-400">Observation (T = 0)</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={timelineStep}
              onChange={e => setTimelineStep(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-ocean-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="border-l border-ocean-800 pl-3 flex flex-col font-mono text-[10px]">
            <span className="text-slate-400">Wind: 14kt @ 230°</span>
            <span className="text-teal-400">Current: 1.2kt @ 120°</span>
          </div>
        </div>
      )}

      {/* Quick Vessel Counter / Status (Top Right) */}
      <div className="absolute top-4 right-14 z-20 bg-ocean-900/90 backdrop-blur-md border border-ocean-750 px-3 py-1.5 rounded-lg shadow-panel text-xs flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-cyan-300 font-mono">
          <Ship className="w-3.5 h-3.5 text-cyan-400" />
          <span>{vessels.length} Vessels in Zone</span>
        </div>
        <span className="text-ocean-700">|</span>
        <div className="flex items-center gap-1.5 text-rose-300 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>{incidents.length} Slicks</span>
        </div>
      </div>
    </div>
  );
};
