import * as React from 'react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Globe, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  ShieldAlert, 
  Crosshair, 
  Radio, 
  Volume2, 
  VolumeX, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Terminal, 
  Zap,
  Activity,
  Layers,
  Search,
  Info
} from 'lucide-react';
import { Coordinates, Satellite } from '../types';
import { 
  InterceptionHotspot, 
  SIGNAL_INTERCEPTION_HOTSPOTS, 
  WORLD_CONTINENTS_GEOJSON,
  getFrequencyBandDetails,
  FrequencyBandInfo
} from '../utils/tacticalGlobeData';
import { audioController } from '../services/audioService';

interface Props {
  userLoc: Coordinates;
  satellite: Satellite;
  isStealthMode?: boolean;
  onLocChange?: (loc: Coordinates) => void;
  isFullscreen?: boolean;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
}

export const TacticalGlobeOverlay: React.FC<Props> = ({
  userLoc,
  satellite,
  isStealthMode = false,
  onLocChange,
  isFullscreen = false,
  onClose,
  onToggleFullscreen
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Responsive Globe container dimensions
  const [globeDimensions, setGlobeDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 480 });

  // Globe orientation state: [yaw/lambda, pitch/phi, roll/gamma]
  const [rotation, setRotation] = useState<[number, number, number]>([-userLoc.lng, -userLoc.lat, 0]);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<InterceptionHotspot | null>(SIGNAL_INTERCEPTION_HOTSPOTS[0]);
  // Active Interactive Tooltip summary card on globe surface
  const [activeTooltipHotspot, setActiveTooltipHotspot] = useState<InterceptionHotspot | null>(SIGNAL_INTERCEPTION_HOTSPOTS[0]);
  const [threatFilter, setThreatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showArcs, setShowArcs] = useState<boolean>(true);
  const [isJammingActive, setIsJammingActive] = useState<boolean>(false);
  const [scanPulseAngle, setScanPulseAngle] = useState<number>(0);

  // References for requestAnimationFrame
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const rotationRef = useRef<[number, number, number]>(rotation);
  rotationRef.current = rotation;
  const isAutoSpinningRef = useRef<boolean>(isAutoSpinning);
  isAutoSpinningRef.current = isAutoSpinning;

  // Track globe container dimensions dynamically
  useEffect(() => {
    if (!globeContainerRef.current) return;
    const updateSize = () => {
      if (globeContainerRef.current) {
        const w = globeContainerRef.current.clientWidth;
        const h = globeContainerRef.current.clientHeight;
        if (w > 50 && h > 50) {
          setGlobeDimensions({ width: Math.round(w), height: Math.round(h) });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(globeContainerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isFullscreen]);

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    return SIGNAL_INTERCEPTION_HOTSPOTS.filter(h => {
      const matchesThreat = threatFilter === 'ALL' || h.threatLevel === threatFilter;
      const matchesSearch = !searchQuery || 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        h.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.signalType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesThreat && matchesSearch;
    });
  }, [threatFilter, searchQuery]);

  // Real-time calculation of active tooltip coordinate on the 3D globe surface
  const tooltipData = useMemo(() => {
    if (!activeTooltipHotspot) return null;
    const coords: [number, number] = [activeTooltipHotspot.lng, activeTooltipHotspot.lat];
    
    // Check if hotspot is facing the camera / visible on this hemisphere
    const isFacing = d3.geoDistance([-rotation[0], -rotation[1]], coords) < Math.PI / 2;
    if (!isFacing) return null;

    const width = globeDimensions.width;
    const height = globeDimensions.height;
    const radius = (Math.min(width, height) / 2) * 0.78 * zoomScale;

    const proj = d3.geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate(rotation);

    const pt = proj(coords);
    if (!pt) return null;

    const [x, y] = pt;
    const cardW = 300;
    const cardH = 240;

    let left = x + 24;
    let isLeftAnchored = false;
    if (left + cardW > width - 14) {
      left = x - cardW - 24;
      isLeftAnchored = true;
    }
    left = Math.max(12, Math.min(width - cardW - 12, left));

    let top = y - cardH / 2;
    top = Math.max(16, Math.min(height - cardH - 16, top));

    // Distance calculation from operator fix in km
    const distRad = d3.geoDistance([userLoc.lng, userLoc.lat], coords);
    const distKm = Math.round(distRad * 6371);

    const bandInfo = getFrequencyBandDetails(activeTooltipHotspot.frequency);

    return {
      x,
      y,
      left,
      top,
      isLeftAnchored,
      distKm,
      bandInfo,
      hotspot: activeTooltipHotspot
    };
  }, [activeTooltipHotspot, rotation, zoomScale, globeDimensions, userLoc]);

  // Handle ESC key to exit fullscreen or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen && onToggleFullscreen) {
          onToggleFullscreen();
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen, onClose]);

  // Main D3 Globe Render loop
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node() || !globeContainerRef.current) return;

    const width = globeDimensions.width || 700;
    const height = globeDimensions.height || (isFullscreen ? 650 : 450);
    const radius = (Math.min(width, height) / 2) * 0.78 * zoomScale;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // D3 Orthographic Projection
    const projection = d3.geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate(rotation);

    const pathGenerator = d3.geoPath().projection(projection);

    // Setup SVG groups
    svg.selectAll('*').remove();

    // Defs & Filters
    const defs = svg.append('defs');

    // Globe space glow
    const filterGlow = defs.append('filter')
      .attr('id', 'tacticalGlow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    filterGlow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    filterGlow.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter().append('feMergeNode').attr('in', d => d);

    // Radial gradient for ocean / atmosphere
    const atmosphereGrad = defs.append('radialGradient')
      .attr('id', 'atmosphereGlow')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    atmosphereGrad.append('stop').attr('offset', '70%').attr('stop-color', '#020617').attr('stop-opacity', '0.9');
    atmosphereGrad.append('stop').attr('offset', '98%').attr('stop-color', isStealthMode ? '#7e22ce' : '#0891b2').attr('stop-opacity', '0.45');
    atmosphereGrad.append('stop').attr('offset', '100%').attr('stop-color', isStealthMode ? '#a855f7' : '#22d3ee').attr('stop-opacity', '0.8');

    // Outer Space Background Circle (Atmospheric Halo)
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius + 5)
      .attr('fill', 'url(#atmosphereGlow)')
      .attr('stroke', isStealthMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(34, 211, 238, 0.3)')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#tacticalGlow)');

    // Tactical Outer Rim Gauge
    const rimGroup = svg.append('g').attr('class', 'tactical-rim');
    rimGroup.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius + 14)
      .attr('fill', 'none')
      .attr('stroke', isStealthMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 211, 238, 0.15)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '8 4');

    // Base Sphere Globe body
    svg.append('path')
      .datum({ type: 'Sphere' } as any)
      .attr('d', pathGenerator as any)
      .attr('fill', '#030712')
      .attr('stroke', isStealthMode ? '#9333ea' : '#0e7490')
      .attr('stroke-width', 1.5);

    // Graticule grid lines
    if (showGraticule) {
      const graticule = d3.geoGraticule().step([20, 20]);
      svg.append('path')
        .datum(graticule())
        .attr('d', pathGenerator as any)
        .attr('fill', 'none')
        .attr('stroke', isStealthMode ? 'rgba(147, 51, 234, 0.15)' : 'rgba(14, 116, 144, 0.2)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2 3');

      // Equator highlight
      svg.append('path')
        .datum({ type: 'LineString', coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, 0]) } as any)
        .attr('d', pathGenerator as any)
        .attr('fill', 'none')
        .attr('stroke', isStealthMode ? 'rgba(192, 132, 252, 0.3)' : 'rgba(56, 189, 248, 0.35)')
        .attr('stroke-width', 1.2);
    }

    // Continents
    const continentGroup = svg.append('g').attr('class', 'continents');
    continentGroup.selectAll('path')
      .data(WORLD_CONTINENTS_GEOJSON.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('fill', isStealthMode ? 'rgba(88, 28, 135, 0.35)' : 'rgba(15, 23, 42, 0.85)')
      .attr('stroke', isStealthMode ? '#a855f7' : '#06b6d4')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.85);

    // Radar scan beam line revolving
    const radarAngleRad = (scanPulseAngle * Math.PI) / 180;
    const radarEndLng = (-rotation[0] + scanPulseAngle) % 360 - 180;
    const radarArcGeo: any = {
      type: 'LineString',
      coordinates: [
        [radarEndLng, 85],
        [radarEndLng, -85]
      ]
    };
    svg.append('path')
      .datum(radarArcGeo)
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', isStealthMode ? 'rgba(216, 180, 254, 0.4)' : 'rgba(34, 211, 238, 0.45)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 2');

    // Satellite Position on globe
    const satCoords: [number, number] = [satellite.longitude, 0];
    const isSatVisible = d3.geoDistance([-rotation[0], -rotation[1]], satCoords) < Math.PI / 2;
    if (isSatVisible) {
      const satPoint = projection(satCoords);
      if (satPoint) {
        const satG = svg.append('g')
          .attr('transform', `translate(${satPoint[0]}, ${satPoint[1]})`)
          .attr('class', 'cursor-pointer');

        // Satellite coverage ring
        satG.append('circle')
          .attr('r', 32)
          .attr('fill', isStealthMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(34, 211, 238, 0.08)')
          .attr('stroke', isStealthMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(34, 211, 238, 0.4)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3 3');

        // Target diamond
        satG.append('rect')
          .attr('x', -6).attr('y', -6)
          .attr('width', 12).attr('height', 12)
          .attr('fill', 'rgba(245, 158, 11, 0.3)')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('transform', 'rotate(45)');

        satG.append('text')
          .attr('x', 14).attr('y', 4)
          .attr('fill', '#f59e0b')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(`SAT: ${satellite.name.substring(0, 12)}`);
      }
    }

    // User Location Node
    const userCoords: [number, number] = [userLoc.lng, userLoc.lat];
    const isUserVisible = d3.geoDistance([-rotation[0], -rotation[1]], userCoords) < Math.PI / 2;
    if (isUserVisible) {
      const userPoint = projection(userCoords);
      if (userPoint) {
        const userG = svg.append('g').attr('transform', `translate(${userPoint[0]}, ${userPoint[1]})`);
        userG.append('circle')
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', isStealthMode ? '#c084fc' : '#22d3ee')
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.7);

        userG.append('circle')
          .attr('r', 4)
          .attr('fill', isStealthMode ? '#a855f7' : '#06b6d4')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1);

        userG.append('text')
          .attr('x', 12).attr('y', -4)
          .attr('fill', isStealthMode ? '#c084fc' : '#22d3ee')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text('OPERATOR_FIX');
      }
    }

    // Interception Arcs (geodesic paths)
    if (showArcs && selectedHotspot) {
      const hotspotCoords: [number, number] = [selectedHotspot.lng, selectedHotspot.lat];
      const linkGeo: any = {
        type: 'LineString',
        coordinates: [userCoords, hotspotCoords]
      };

      svg.append('path')
        .datum(linkGeo)
        .attr('d', pathGenerator as any)
        .attr('fill', 'none')
        .attr('stroke', selectedHotspot.threatLevel === 'SEVERE' ? '#ef4444' : (isStealthMode ? '#a855f7' : '#22d3ee'))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5 3')
        .attr('opacity', 0.8)
        .attr('filter', 'url(#tacticalGlow)');
    }

    // Signal Interception Hotspots
    const hotspotsGroup = svg.append('g').attr('class', 'hotspots');

    filteredHotspots.forEach(hotspot => {
      const coords: [number, number] = [hotspot.lng, hotspot.lat];
      const isVisible = d3.geoDistance([-rotation[0], -rotation[1]], coords) < Math.PI / 2;
      if (!isVisible) return;

      const pt = projection(coords);
      if (!pt) return;

      const isSelected = selectedHotspot?.id === hotspot.id;
      const isTooltipActive = activeTooltipHotspot?.id === hotspot.id;

      // Color coding based on threat level
      let color = '#22d3ee';
      if (hotspot.threatLevel === 'SEVERE') color = '#ef4444';
      else if (hotspot.threatLevel === 'ELEVATED') color = '#f97316';
      else if (hotspot.threatLevel === 'GUARDED') color = '#f59e0b';
      else if (hotspot.threatLevel === 'NOMINAL') color = '#10b981';

      const hG = hotspotsGroup.append('g')
        .attr('transform', `translate(${pt[0]}, ${pt[1]})`)
        .attr('class', 'cursor-pointer group')
        .on('click', (event: any) => {
          if (event && event.stopPropagation) {
            event.stopPropagation();
          }
          setSelectedHotspot(hotspot);
          setActiveTooltipHotspot(hotspot);
          audioController.playChirp();
          if (hotspot.threatLevel === 'SEVERE') {
            audioController.playAlert();
          }
        });

      // Interactive title tooltip
      const band = getFrequencyBandDetails(hotspot.frequency);
      hG.append('title')
        .text(`[${hotspot.designation}] ${hotspot.name}\nFrequency Band: ${band.band} (${band.formattedFreq})\nClassification: ${hotspot.signalType}\nCoordinates: ${hotspot.lat.toFixed(4)}°N, ${hotspot.lng.toFixed(4)}°E\nClick to inspect summary card.`);

      // Outer pulse wave ring
      hG.append('circle')
        .attr('r', isTooltipActive ? 22 : (isSelected ? 18 : 11))
        .attr('fill', `${color}${isTooltipActive ? '25' : '15'}`)
        .attr('stroke', color)
        .attr('stroke-width', isTooltipActive ? 2.5 : (isSelected ? 2 : 1))
        .attr('stroke-dasharray', isTooltipActive ? '3 2' : (isSelected ? 'none' : '3 2'))
        .attr('opacity', isTooltipActive ? 1 : (isSelected ? 0.9 : 0.6));

      // Active tooltip targeting crosshair reticle
      if (isTooltipActive) {
        hG.append('circle')
          .attr('r', 14)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '4 2')
          .attr('opacity', 0.9);
      }

      // Core point
      hG.append('circle')
        .attr('r', isTooltipActive ? 7 : (isSelected ? 6 : 4))
        .attr('fill', isTooltipActive ? '#ffffff' : color)
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      // Designation label
      if (isSelected || isTooltipActive || zoomScale > 1.3) {
        hG.append('text')
          .attr('x', 14)
          .attr('y', 3)
          .attr('fill', '#ffffff')
          .attr('font-size', (isTooltipActive || isSelected) ? '10px' : '8px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('filter', 'drop-shadow(0 0 3px black)')
          .text(hotspot.designation);
      }
    });

    // D3 Drag for manual globe rotation
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => {
        setIsAutoSpinning(false);
      })
      .on('drag', (event) => {
        const sensitivity = 0.45 / zoomScale;
        setRotation(prev => {
          const nextYaw = prev[0] + event.dx * sensitivity;
          const nextPitch = Math.max(-85, Math.min(85, prev[1] - event.dy * sensitivity));
          return [nextYaw, nextPitch, prev[2]];
        });
      });

    svg.call(drag as any);

    // D3 Zoom / Wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomScale(prev => Math.max(0.7, Math.min(3.5, prev + delta)));
    };

    const node = svgRef.current;
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (node) {
        node.removeEventListener('wheel', handleWheel);
      }
    };
  }, [
    rotation, 
    zoomScale, 
    filteredHotspots, 
    selectedHotspot, 
    activeTooltipHotspot,
    showGraticule, 
    showArcs, 
    satellite, 
    userLoc, 
    isStealthMode, 
    isFullscreen,
    scanPulseAngle,
    globeDimensions
  ]);

  // Smooth Auto-rotation loop
  useEffect(() => {
    let lastStamp = performance.now();
    const tick = (now: number) => {
      const delta = now - lastStamp;
      lastStamp = now;

      // Update scan pulse line
      setScanPulseAngle(prev => (prev + delta * 0.05) % 360);

      if (isAutoSpinningRef.current) {
        setRotation(prev => {
          const newYaw = (prev[0] + delta * 0.015) % 360;
          return [newYaw, prev[1], prev[2]];
        });
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Quick Action: Focus Hotspot
  const handleFocusHotspot = (hotspot: InterceptionHotspot) => {
    setSelectedHotspot(hotspot);
    setActiveTooltipHotspot(hotspot);
    setIsAutoSpinning(false);
    setRotation([-hotspot.lng, -hotspot.lat, 0]);
    audioController.playChirp();
  };

  // Quick Action: Focus Operator
  const handleFocusOperator = () => {
    setIsAutoSpinning(false);
    setRotation([-userLoc.lng, -userLoc.lat, 0]);
    audioController.playChirp();
  };

  // Quick Action: Focus Satellite
  const handleFocusSat = () => {
    setIsAutoSpinning(false);
    setRotation([-satellite.longitude, 0, 0]);
    audioController.playChirp();
  };

  // Export SIGINT Hotspots Report
  const handleExportSigint = () => {
    const reportData = `========================================================================
TACTICAL SIGINT GLOBE // INTERCEPTION HOTSPOTS TELEMETRY REPORT
GENERATED: ${new Date().toISOString()}
CLASSIFICATION: TOP SECRET // STIA-TACTICAL-SATCOM
========================================================================

CURRENT OPERATOR LOCATION: ${userLoc.lat.toFixed(4)}°N, ${userLoc.lng.toFixed(4)}°E
ACTIVE SATELLITE ASSET: ${satellite.name} (${satellite.orbitalSlot})
TOTAL TRACKED HOTSPOTS: ${SIGNAL_INTERCEPTION_HOTSPOTS.length}

------------------------------------------------------------------------
INTERCEPTED TARGETS DOSSIER:
------------------------------------------------------------------------
${SIGNAL_INTERCEPTION_HOTSPOTS.map((h, i) => `
[HOTSPOT ${i + 1}] ${h.designation} - ${h.name}
- Coordinates: ${h.lat.toFixed(4)}°N, ${h.lng.toFixed(4)}°E
- Signal Type: ${h.signalType}
- Carrier Freq: ${h.frequency} GHz | BW: ${h.bandwidth} MHz | SNR: ${h.snr} dB
- Threat Level: ${h.threatLevel} | Status: ${h.status}
- Encryption: ${h.encryption}
- Origin: ${h.origin}
- Intercepted Payload: ${h.payloadFragment || 'N/A'}
- Description: ${h.description}
`).join('\n')}

END OF SIGINT REPORT // CHECKSUM_VERIFIED: 0x${Math.random().toString(16).substring(2, 10).toUpperCase()}
`;

    const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `STIA_SIGINT_GLOBE_EXPORT_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    audioController.playChirp();
  };

  const getThreatBadgeClass = (threat: string) => {
    switch (threat) {
      case 'SEVERE': return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'ELEVATED': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'GUARDED': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'NOMINAL': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden font-mono select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[100] w-screen h-screen bg-slate-950/95 backdrop-blur-2xl flex flex-col p-4 md:p-6'
          : 'glass rounded-[2.5rem] p-6 border-2 border-slate-800 bg-slate-950/70 shadow-2xl transition-all duration-700'
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      {/* Top Header HUD Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm md:text-base font-black text-white tracking-widest uppercase">
                Tactical 3D Globe <span className="text-cyan-400">SIGINT Overlay</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                D3_ORTHO_v4
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Real-time Global Interception Hotspots // Lat-Long Arc Telemetry
            </p>
          </div>
        </div>

        {/* Global Controls & Tools */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Focus Targets */}
          <button 
            onClick={handleFocusOperator}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-[9px] font-bold text-slate-300 hover:text-cyan-400 uppercase tracking-widest transition-all"
            title="Center on Operator"
          >
            Locate_Operator
          </button>
          <button 
            onClick={handleFocusSat}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-[9px] font-bold text-slate-300 hover:text-amber-400 uppercase tracking-widest transition-all"
            title="Center on Satellite"
          >
            Locate_Sat
          </button>

          {/* Auto-Spin Toggle */}
          <button 
            onClick={() => {
              setIsAutoSpinning(!isAutoSpinning);
              audioController.playChirp();
            }}
            className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center space-x-1.5 transition-all ${
              isAutoSpinning 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${isAutoSpinning ? 'animate-spin' : ''}`} />
            <span>{isAutoSpinning ? 'SPIN_ACTIVE' : 'SPIN_PAUSED'}</span>
          </button>

          {/* Zoom In / Out */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5">
            <button 
              onClick={() => setZoomScale(prev => Math.min(3.5, prev + 0.25))}
              className="p-1.5 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[8px] font-bold text-slate-500 px-1">{zoomScale.toFixed(1)}x</span>
            <button 
              onClick={() => setZoomScale(prev => Math.max(0.7, prev - 0.25))}
              className="p-1.5 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Graticule & Arcs Toggles */}
          <button 
            onClick={() => setShowGraticule(!showGraticule)}
            className={`px-2 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${
              showGraticule ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-500'
            }`}
            title="Toggle Lat/Long Grid"
          >
            Grid
          </button>

          {/* Export SIGINT Button */}
          <button 
            onClick={handleExportSigint}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-[9px] font-bold text-cyan-400 uppercase tracking-widest transition-all"
            title="Export Hotspots Telemetry Log"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export_SIGINT</span>
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button 
              onClick={onToggleFullscreen}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-xl text-slate-300 hover:text-cyan-400 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Globe'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Close Button if modal */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded-xl text-red-400 hover:text-red-300 transition-all"
              title="Close Globe"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: 3D Globe + Telemetry Side HUD */}
      <div className={`relative flex-grow grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-4 items-stretch min-h-0`}>
        {/* Left/Center: D3 Interactive Globe SVG Container */}
        <div 
          ref={globeContainerRef}
          className={`${isFullscreen ? 'lg:col-span-8' : 'lg:col-span-7'} flex flex-col justify-center items-center relative min-h-[380px] bg-slate-950/60 rounded-3xl border border-slate-800/80 p-2 overflow-hidden shadow-inner`}
        >
          {/* Compass / Orientation HUD overlay */}
          <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-cyan-400 tracking-wider">YAW:</span>
              <span className="text-[10px] text-slate-300 font-bold">{Math.round(-rotation[0])}°</span>
              <span className="text-[10px] font-black text-cyan-400 tracking-wider ml-2">PITCH:</span>
              <span className="text-[10px] text-slate-300 font-bold">{Math.round(-rotation[1])}°</span>
            </div>
            <div className="text-[8px] text-slate-500">
              DRAG: ROTATE // SCROLL: ZOOM // CLICK: SELECT INTERCEPT
            </div>
          </div>

          {/* Signal Threat Filter Pills */}
          <div className="absolute top-3 right-4 z-20 flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
            {['ALL', 'SEVERE', 'ELEVATED', 'GUARDED', 'NOMINAL'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setThreatFilter(t);
                  audioController.playChirp();
                }}
                className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                  threatFilter === t 
                    ? 'bg-cyan-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* D3 Render SVG */}
          <svg 
            ref={svgRef} 
            className="w-full h-full max-h-[700px] cursor-grab active:cursor-grabbing drop-shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          />

          {/* Tactical Leader Line Overlay from Globe Hotspot to Tooltip Card */}
          {tooltipData && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-25">
              <line 
                x1={tooltipData.x} 
                y1={tooltipData.y} 
                x2={tooltipData.isLeftAnchored ? tooltipData.left + 300 : tooltipData.left} 
                y2={tooltipData.top + 28} 
                stroke={tooltipData.hotspot.threatLevel === 'SEVERE' ? '#ef4444' : '#22d3ee'} 
                strokeWidth="1.5" 
                strokeDasharray="4 2"
                opacity="0.85"
              />
              <circle 
                cx={tooltipData.x} 
                cy={tooltipData.y} 
                r="10" 
                fill="none" 
                stroke={tooltipData.hotspot.threatLevel === 'SEVERE' ? '#ef4444' : '#22d3ee'} 
                strokeWidth="1.5" 
                strokeDasharray="3 3"
                className="animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <circle 
                cx={tooltipData.x} 
                cy={tooltipData.y} 
                r="3.5" 
                fill={tooltipData.hotspot.threatLevel === 'SEVERE' ? '#ef4444' : '#22d3ee'} 
              />
            </svg>
          )}

          {/* Interactive Summary Card Tooltip */}
          {tooltipData && (
            <div 
              className="absolute z-30 pointer-events-auto w-[300px] max-w-[calc(100%-24px)] rounded-2xl glass border border-cyan-500/50 bg-slate-950/95 p-3.5 shadow-[0_0_30px_rgba(34,211,238,0.3)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 transition-all font-mono"
              style={{ left: `${tooltipData.left}px`, top: `${tooltipData.top}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Designation, Title, Threat Badge & Close Button */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/90 pb-2 mb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      className="w-2 h-2 rounded-full animate-ping shrink-0" 
                      style={{
                        backgroundColor: tooltipData.hotspot.threatLevel === 'SEVERE' ? '#ef4444' :
                                         tooltipData.hotspot.threatLevel === 'ELEVATED' ? '#f97316' :
                                         tooltipData.hotspot.threatLevel === 'GUARDED' ? '#f59e0b' : '#10b981'
                      }} 
                    />
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest truncate">
                      {tooltipData.hotspot.designation}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate uppercase tracking-tight mt-0.5" title={tooltipData.hotspot.name}>
                    {tooltipData.hotspot.name}
                  </h4>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getThreatBadgeClass(tooltipData.hotspot.threatLevel)}`}>
                    {tooltipData.hotspot.threatLevel}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveTooltipHotspot(null);
                      audioController.playChirp();
                    }}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Dismiss tooltip"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detected Frequency Band Panel */}
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 mb-2">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400 mb-1">
                  <span className="flex items-center space-x-1 text-cyan-400 font-bold">
                    <Radio className="w-2.5 h-2.5" />
                    <span>Detected Frequency Band</span>
                  </span>
                  <span className="text-slate-500 font-mono">{tooltipData.bandInfo.nominalRange}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black text-white">{tooltipData.bandInfo.band}</span>
                  <span className={`text-[11px] font-mono font-black ${tooltipData.bandInfo.color}`}>
                    {tooltipData.bandInfo.formattedFreq}
                  </span>
                </div>
                <div className="text-[8px] text-cyan-300/80 font-mono mt-0.5 truncate">
                  {tooltipData.bandInfo.channelClass}
                </div>
              </div>

              {/* Signal Classification & Coordinates Section */}
              <div className="space-y-1.5 text-[9px] mb-2.5">
                {/* Signal Classification */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                    Signal Classification:
                  </span>
                  <span className="text-amber-300 font-bold leading-tight mt-0.5 block">
                    {tooltipData.hotspot.signalType}
                  </span>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
                    <span>STATUS: <strong className="text-white">{tooltipData.hotspot.status}</strong></span>
                    <span>BW: <strong className="text-cyan-300">{tooltipData.hotspot.bandwidth} MHz</strong></span>
                    <span>SNR: <strong className="text-emerald-400">+{tooltipData.hotspot.snr} dB</strong></span>
                  </div>
                </div>

                {/* Specific Coordinate & Range */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                      Specific Coordinates:
                    </span>
                    <span className="text-slate-200 font-mono font-black text-[9px]">
                      {tooltipData.hotspot.lat >= 0 ? `${tooltipData.hotspot.lat.toFixed(4)}°N` : `${Math.abs(tooltipData.hotspot.lat).toFixed(4)}°S`}, {tooltipData.hotspot.lng >= 0 ? `${tooltipData.hotspot.lng.toFixed(4)}°E` : `${Math.abs(tooltipData.hotspot.lng).toFixed(4)}°W`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                      Range to Operator:
                    </span>
                    <span className="text-cyan-400 font-mono font-bold text-[9px]">
                      {tooltipData.distKm.toLocaleString()} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleFocusHotspot(tooltipData.hotspot)}
                  className="flex-1 py-1.5 px-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center space-x-1"
                  title="Center globe on this coordinate"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span>Center_Target</span>
                </button>
                <button
                  onClick={() => {
                    if (onLocChange) {
                      onLocChange({ lat: tooltipData.hotspot.lat, lng: tooltipData.hotspot.lng });
                      audioController.playChirp();
                    }
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all text-center"
                  title="Set operator coordinates to this coordinate"
                >
                  Set_Waypoint
                </button>
              </div>
            </div>
          )}

          {/* Bottom Live Scan Status */}
          <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex items-center justify-between text-[8px] text-slate-500 bg-slate-950/70 p-2 rounded-xl border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300 font-bold">RADAR_SWEEP_FREQ: 2.4 GHz</span>
              <span>// ACTIVE_SURFACE: ORTHOGRAPHIC</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>HOTSPOTS_TRACKED: {filteredHotspots.length}</span>
              <span className="text-cyan-400">CARRIER_LOCK: LOCKED</span>
            </div>
          </div>
        </div>

        {/* Right: Selected Hotspot Telemetry Dossier */}
        <div className={`${isFullscreen ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col space-y-3 overflow-y-auto max-h-[680px] custom-scrollbar`}>
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotspots or designations..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/50 uppercase placeholder:normal-case placeholder:text-slate-600 font-mono"
            />
          </div>

          {/* Hotspot Dossier Card */}
          {selectedHotspot ? (
            <div className="glass p-4 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-white uppercase">{selectedHotspot.name}</span>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-bold tracking-widest">{selectedHotspot.designation}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${getThreatBadgeClass(selectedHotspot.threatLevel)}`}>
                  {selectedHotspot.threatLevel}
                </span>
              </div>

              {/* Coordinates & Origin */}
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">Coordinates</span>
                  <span className="text-slate-200 font-black">{selectedHotspot.lat.toFixed(4)}°N, {selectedHotspot.lng.toFixed(4)}°E</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="text-slate-500 block uppercase font-bold text-[8px]">Signal Type</span>
                  <span className="text-cyan-400 font-black truncate block">{selectedHotspot.signalType}</span>
                </div>
              </div>

              {/* RF Parameters */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[9px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>CARRIER FREQUENCY:</span>
                  <span className="text-cyan-400 font-bold">{selectedHotspot.frequency} GHz</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>BANDWIDTH:</span>
                  <span className="text-cyan-400 font-bold">{selectedHotspot.bandwidth} MHz</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>SIGNAL-TO-NOISE:</span>
                  <span className="text-emerald-400 font-bold">{selectedHotspot.snr} dB</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>ENCRYPTION PROTOCOL:</span>
                  <span className="text-amber-400 font-bold truncate max-w-[140px]">{selectedHotspot.encryption}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>INTERCEPT STATUS:</span>
                  <span className="text-white font-bold">{selectedHotspot.status}</span>
                </div>
              </div>

              {/* Description & Origin */}
              <div className="text-[9px] text-slate-400 leading-relaxed bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/40">
                <span className="text-slate-500 font-bold uppercase block text-[8px] mb-1">Telemetry Intelligence:</span>
                {selectedHotspot.description}
              </div>

              {/* Payload Fragment Hex */}
              {selectedHotspot.payloadFragment && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Demodulated Frame Frame Fragment:</span>
                  <p className="text-[9px] text-cyan-300 font-mono break-all bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                    {selectedHotspot.payloadFragment}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    if (onLocChange) {
                      onLocChange({ lat: selectedHotspot.lat, lng: selectedHotspot.lng });
                      audioController.playChirp();
                    }
                  }}
                  className="py-2.5 px-3 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-cyan-500/30 text-center"
                >
                  Set_As_Waypoint
                </button>
                <button
                  onClick={() => {
                    setIsJammingActive(!isJammingActive);
                    audioController.playAlert();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border text-center ${
                    isJammingActive 
                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : 'bg-red-950/30 hover:bg-red-900/50 text-red-400 border-red-500/30'
                  }`}
                >
                  {isJammingActive ? 'EW_JAMMING_ACTIVE' : 'Engage_Jamming'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-6 rounded-3xl border border-slate-800 text-center text-slate-500 text-xs py-12">
              Select any hotspot on the globe to inspect real-time SIGINT telemetry.
            </div>
          )}

          {/* Hotspots Quick List */}
          <div className="glass p-3 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <span>Tracked Intercept Nodes</span>
              <span className="text-cyan-400">{filteredHotspots.length} Total</span>
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
              {filteredHotspots.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleFocusHotspot(h)}
                  className={`p-2 rounded-xl border flex items-center justify-between text-[9px] cursor-pointer transition-all ${
                    selectedHotspot?.id === h.id 
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-white' 
                      : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      h.threatLevel === 'SEVERE' ? 'bg-red-500' :
                      h.threatLevel === 'ELEVATED' ? 'bg-orange-500' :
                      h.threatLevel === 'GUARDED' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold truncate">{h.name}</span>
                  </div>
                  <span className="text-[8px] mono text-slate-500 ml-2 shrink-0">{h.frequency} GHz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
