import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Atom, 
  Cpu, 
  Activity, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Radio, 
  Layers, 
  Share2, 
  AlertTriangle,
  RotateCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Satellite } from '../types';
import { audioController } from '../services/audioService';

export interface QuantumNode {
  id: string;
  name: string;
  type: 'QKD_SATELLITE' | 'ORBITAL_REPEATER' | 'GROUND_OGS' | 'BELL_ANALYZER';
  role: string;
  qubitCapacity: number;
  logicalQubits: number;
  fidelity: number; // percentage
  t1_coherence: number; // microseconds
  t2_dephasing: number; // microseconds
  qber: number; // Quantum Bit Error Rate %
  cryoTemp_mK: number; // millikelvin
  qubitTech: 'Trapped-Ion' | 'Superconducting Transmon' | 'Photonic Polarized' | 'NV-Center';
  theta: number; // Bloch sphere theta
  phi: number; // Bloch sphere phi
  status: 'ENTANGLED' | 'SWAPPING' | 'COHERENT' | 'DECOHERED';
  x?: number;
  y?: number;
}

export interface EntanglementChannel {
  fromId: string;
  toId: string;
  bellState: '|Φ⁺⟩' | '|Φ⁻⟩' | '|Ψ⁺⟩' | '|Ψ⁻⟩';
  fidelity: number;
  pairRate: number; // kPairs/s
  active: boolean;
  isSwapped?: boolean;
}

interface Props {
  satellites: Satellite[];
  selectedSat: Satellite;
  onNodeSelect?: (node: QuantumNode) => void;
}

export const QuantumTopologyVisualizer: React.FC<Props> = ({ satellites, selectedSat }) => {
  // Generate initial quantum network nodes mapped from satellites + ground optical stations
  const [nodes, setNodes] = useState<QuantumNode[]>([]);
  const [channels, setChannels] = useState<EntanglementChannel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isSwappingActive, setIsSwappingActive] = useState<boolean>(false);
  const [swapHistory, setSwapHistory] = useState<string[]>([]);
  const [qkdProtocol, setQkdProtocol] = useState<'E91' | 'BB84' | 'BBM92'>('E91');
  const [isQkdRunning, setIsQkdRunning] = useState<boolean>(false);
  const [secretKeyCount, setSecretKeyCount] = useState<number>(482910);
  const [pulseCount, setPulseCount] = useState<number>(0);

  // Initialize Quantum Topology Nodes
  useEffect(() => {
    const qkdSats: QuantumNode[] = satellites.slice(0, 5).map((sat, idx) => ({
      id: `NODE-SAT-${sat.id}`,
      name: `QKD-${sat.name}`,
      type: 'QKD_SATELLITE',
      role: 'Spaceborne Entangled Photon Source (SPDC)',
      qubitCapacity: 64,
      logicalQubits: 16,
      fidelity: 98.8 + Math.random() * 1.0,
      t1_coherence: 350 + Math.floor(Math.random() * 50),
      t2_dephasing: 180 + Math.floor(Math.random() * 30),
      qber: 1.1 + Math.random() * 0.4,
      cryoTemp_mK: 15,
      qubitTech: 'Photonic Polarized',
      theta: Math.PI / 4 + (idx * 0.2),
      phi: Math.PI / 3 + (idx * 0.3),
      status: 'ENTANGLED'
    }));

    const groundStations: QuantumNode[] = [
      {
        id: 'NODE-OGS-TENERIFE',
        name: 'Tenerife OGS Gateway',
        type: 'GROUND_OGS',
        role: 'Optical Ground Station Telescope (1.0m Aperture)',
        qubitCapacity: 128,
        logicalQubits: 32,
        fidelity: 99.4,
        t1_coherence: 520,
        t2_dephasing: 290,
        qber: 0.9,
        cryoTemp_mK: 10,
        qubitTech: 'Trapped-Ion',
        theta: Math.PI / 3,
        phi: Math.PI / 6,
        status: 'ENTANGLED'
      },
      {
        id: 'NODE-OGS-CAMBRIDGE',
        name: 'Cambridge Quantum Node',
        type: 'GROUND_OGS',
        role: 'Quantum Repeater & Cavity-QED Memory',
        qubitCapacity: 96,
        logicalQubits: 24,
        fidelity: 99.1,
        t1_coherence: 480,
        t2_dephasing: 260,
        qber: 1.2,
        cryoTemp_mK: 12,
        qubitTech: 'Superconducting Transmon',
        theta: Math.PI / 2,
        phi: Math.PI / 4,
        status: 'ENTANGLED'
      },
      {
        id: 'NODE-OGS-BOULDER',
        name: 'Boulder Ion-Trap Array',
        type: 'BELL_ANALYZER',
        role: 'Bell State Measurement (BSM) Quantum Coincidence',
        qubitCapacity: 256,
        logicalQubits: 64,
        fidelity: 99.6,
        t1_coherence: 740,
        t2_dephasing: 410,
        qber: 0.7,
        cryoTemp_mK: 8,
        qubitTech: 'Trapped-Ion',
        theta: Math.PI / 6,
        phi: Math.PI / 2,
        status: 'COHERENT'
      },
      {
        id: 'NODE-ORBITAL-MEM',
        name: 'LEO Quantum Memory Relay',
        type: 'ORBITAL_REPEATER',
        role: 'Cryogenic Rare-Earth Doped Crystal Storage',
        qubitCapacity: 64,
        logicalQubits: 16,
        fidelity: 98.4,
        t1_coherence: 310,
        t2_dephasing: 150,
        qber: 1.6,
        cryoTemp_mK: 14,
        qubitTech: 'NV-Center',
        theta: Math.PI / 5,
        phi: Math.PI / 3,
        status: 'ENTANGLED'
      }
    ];

    const allNodes = [...qkdSats, ...groundStations];
    setNodes(allNodes);
    setSelectedNodeId(allNodes[0]?.id || '');

    // Generate initial entanglement channels between space and ground nodes
    const initialChannels: EntanglementChannel[] = [];
    const bellStates: ('|Φ⁺⟩' | '|Φ⁻⟩' | '|Ψ⁺⟩' | '|Ψ⁻⟩')[] = ['|Φ⁺⟩', '|Φ⁻⟩', '|Ψ⁺⟩', '|Ψ⁻⟩'];

    // Connect satellites in orbital quantum ring
    for (let i = 0; i < qkdSats.length; i++) {
      const nextIdx = (i + 1) % qkdSats.length;
      initialChannels.push({
        fromId: qkdSats[i].id,
        toId: qkdSats[nextIdx].id,
        bellState: bellStates[i % bellStates.length],
        fidelity: 98.5 + Math.random() * 1.2,
        pairRate: 24.5 + Math.random() * 8.0,
        active: true
      });
    }

    // Connect space nodes to ground optical stations
    groundStations.forEach((gs, idx) => {
      const targetSat = qkdSats[idx % qkdSats.length];
      if (targetSat) {
        initialChannels.push({
          fromId: targetSat.id,
          toId: gs.id,
          bellState: '|Φ⁺⟩',
          fidelity: 99.1 + Math.random() * 0.7,
          pairRate: 36.2 + Math.random() * 10.0,
          active: true
        });
      }
    });

    setChannels(initialChannels);
  }, [satellites]);

  // Dynamic quantum fluctuations (telemetry tick)
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1);
      setNodes(prev => prev.map(n => ({
        ...n,
        fidelity: Math.min(99.9, Math.max(96.0, n.fidelity + (Math.random() - 0.49) * 0.15)),
        qber: Math.max(0.5, Math.min(3.5, n.qber + (Math.random() - 0.49) * 0.08))
      })));

      setChannels(prev => prev.map(ch => ({
        ...ch,
        fidelity: Math.min(99.9, Math.max(95.5, ch.fidelity + (Math.random() - 0.49) * 0.2)),
        pairRate: Math.max(12.0, ch.pairRate + (Math.random() - 0.49) * 1.5)
      })));

      setSecretKeyCount(prev => prev + Math.floor(Math.random() * 140 + 80));
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Selected node
  const activeNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Overall Global Entanglement Metrics
  const globalMetrics = useMemo(() => {
    if (nodes.length === 0) return { avgFidelity: 99.2, avgQber: 1.15, totalQubits: 512, activeChannels: 0 };
    const avgFidelity = nodes.reduce((acc, n) => acc + n.fidelity, 0) / nodes.length;
    const avgQber = nodes.reduce((acc, n) => acc + n.qber, 0) / nodes.length;
    const totalQubits = nodes.reduce((acc, n) => acc + n.qubitCapacity, 0);
    const activeChannels = channels.filter(c => c.active).length;
    return {
      avgFidelity: avgFidelity.toFixed(2),
      avgQber: avgQber.toFixed(2),
      totalQubits,
      activeChannels
    };
  }, [nodes, channels]);

  // 2D Topology Graph Layout calculation
  const graphLayout = useMemo<Record<string, { x: number; y: number; node: QuantumNode }>>(() => {
    const cx = 250;
    const cy = 250;
    const outerRadius = 180;
    const innerRadius = 90;

    const spaceNodes = nodes.filter(n => n.type === 'QKD_SATELLITE' || n.type === 'ORBITAL_REPEATER');
    const groundNodes = nodes.filter(n => n.type === 'GROUND_OGS' || n.type === 'BELL_ANALYZER');

    const mapped: Record<string, { x: number; y: number; node: QuantumNode }> = {};

    // Position space nodes on outer orbit ring
    spaceNodes.forEach((n, i) => {
      const angle = (i / spaceNodes.length) * Math.PI * 2 - Math.PI / 2;
      mapped[n.id] = {
        x: cx + outerRadius * Math.cos(angle),
        y: cy + outerRadius * Math.sin(angle),
        node: n
      };
    });

    // Position ground nodes on inner terrestrial surface ring
    groundNodes.forEach((n, i) => {
      const angle = (i / groundNodes.length) * Math.PI * 2 - Math.PI / 4;
      mapped[n.id] = {
        x: cx + innerRadius * Math.cos(angle),
        y: cy + innerRadius * Math.sin(angle),
        node: n
      };
    });

    return mapped;
  }, [nodes]);

  // Trigger Entanglement Swapping
  const handleTriggerEntanglementSwap = () => {
    setIsSwappingActive(true);
    audioController.playPulse();

    const timestamp = new Date().toLocaleTimeString();
    const groundNodes = nodes.filter(n => n.type === 'GROUND_OGS');
    const from = groundNodes[0]?.name || 'Tenerife OGS';
    const to = groundNodes[1]?.name || 'Cambridge Node';

    setSwapHistory(prev => [
      `[${timestamp}] BSM Entanglement Swap verified: ${from} <===> ${to} (Fidelity: 99.4%)`,
      ...prev
    ].slice(0, 10));

    // Create swapped channel between ground nodes
    if (groundNodes[0] && groundNodes[1]) {
      setChannels(prev => [
        {
          fromId: groundNodes[0].id,
          toId: groundNodes[1].id,
          bellState: '|Ψ⁺⟩',
          fidelity: 99.3,
          pairRate: 48.0,
          active: true,
          isSwapped: true
        },
        ...prev.filter(c => !(c.fromId === groundNodes[0].id && c.toId === groundNodes[1].id))
      ]);
    }

    setTimeout(() => {
      setIsSwappingActive(false);
      audioController.playChirp();
    }, 2000);
  };

  // Run Quantum Key Distribution Session
  const handleRunQKD = () => {
    setIsQkdRunning(true);
    audioController.playChirp();

    setTimeout(() => {
      setIsQkdRunning(false);
      setSecretKeyCount(prev => prev + 16384);
      audioController.playPulse();
    }, 1800);
  };

  // Purge Decohered Qubits
  const handlePurgeDecoherence = () => {
    audioController.playAlert();
    setNodes(prev => prev.map(n => ({
      ...n,
      fidelity: 99.8,
      qber: 0.65,
      status: 'ENTANGLED'
    })));
  };

  // Export Topology Dossier
  const handleExportTopology = () => {
    const report = `========================================================================
QUANTUM ENTANGLEMENT MESH TOPOLOGY & BELL STATE TELEMETRY
STIA-QKD-LAYER-2 // CLASSIFIED QUANTUM INTEL
GENERATED: ${new Date().toISOString()}
========================================================================

NETWORK SUMMARY:
- Total Entanglement Nodes: ${nodes.length}
- Total Qubit Register Capacity: ${globalMetrics.totalQubits} Physical Qubits
- Average Bell State Fidelity: ${globalMetrics.avgFidelity}%
- Average Quantum Bit Error Rate (QBER): ${globalMetrics.avgQber}%
- Total Sifted Post-Quantum Key Material: ${secretKeyCount} bits

------------------------------------------------------------------------
QUANTUM NODES DOSSIER:
------------------------------------------------------------------------
${nodes.map(n => `
[NODE] ${n.id} - ${n.name}
- Type: ${n.type} | Technology: ${n.qubitTech}
- Role: ${n.role}
- Qubit Capacity: ${n.qubitCapacity} phys / ${n.logicalQubits} logical
- Local Bell Fidelity: ${n.fidelity.toFixed(2)}% | QBER: ${n.qber.toFixed(2)}%
- Coherence Time (T1): ${n.t1_coherence} μs | Dephasing Time (T2): ${n.t2_dephasing} μs
- Cryogenic Base Temp: ${n.cryoTemp_mK} mK
- Bloch Coordinates: (θ: ${n.theta.toFixed(3)} rad, φ: ${n.phi.toFixed(3)} rad)
- Current State: ${n.status}
`).join('\n')}

------------------------------------------------------------------------
ENTANGLED BELL STATE CHANNELS:
------------------------------------------------------------------------
${channels.map(c => `
- Channel: ${nodes.find(n => n.id === c.fromId)?.name} <---> ${nodes.find(n => n.id === c.toId)?.name}
  * Bell State: ${c.bellState}
  * Channel Fidelity: ${c.fidelity.toFixed(2)}%
  * EPR Pair Generation Rate: ${c.pairRate.toFixed(1)} kPairs/s
  * Swapped Long-Distance Link: ${c.isSwapped ? 'YES (Via Teleportation)' : 'NO (Direct Optical)'}
`).join('\n')}

END OF QUANTUM TELEMETRY REPORT // QUANTUM STATE TOMOGRAPHY AFFIRMED
`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STIA_QUANTUM_TOPOLOGY_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    audioController.playChirp();
  };

  return (
    <div className="space-y-6">
      {/* Top Quantum Header & Metrics */}
      <div className="flex flex-col xl:flex-row items-stretch justify-between gap-6 glass p-6 rounded-[2rem] border border-cyan-500/30 bg-slate-950/80 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <Atom className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                Quantum Topology <span className="text-cyan-400">Mesh Visualizer</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                BELL_EPR_MESH
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
              Space-to-Ground Entangled Photon Distribution // Real-Time Quantum Routing
            </p>
          </div>
        </div>

        {/* Global Quantum Metrics Bar */}
        <div className="flex items-center flex-wrap gap-4 sm:gap-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Entanglement_Fidelity</span>
            <span className="text-sm font-black text-emerald-400 font-mono tracking-widest">
              {globalMetrics.avgFidelity}%
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Average_QBER</span>
            <span className="text-sm font-black text-cyan-400 font-mono tracking-widest">
              {globalMetrics.avgQber}% <span className="text-[8px] text-emerald-500 font-normal">&lt; 4.5% safe</span>
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active_Bell_Pairs</span>
            <span className="text-sm font-black text-amber-400 font-mono tracking-widest">
              {globalMetrics.activeChannels * 28} kPairs/s
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sifted_Secret_Bits</span>
            <span className="text-sm font-black text-purple-400 font-mono tracking-widest">
              {(secretKeyCount / 1000).toFixed(1)} kb
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 2D Entanglement Mesh SVG Visualizer */}
        <div className="lg:col-span-7 glass p-6 rounded-[2.5rem] border border-slate-800 bg-slate-950/70 relative flex flex-col items-center justify-center min-h-[480px] shadow-2xl overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Interactive Topology Controls HUD Bar */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-[9px] z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-slate-400 uppercase font-bold">Space-Ground Bell Entanglement Layer</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                PROTO: {qkdProtocol}
              </span>
            </div>
          </div>

          {/* Topology Graph SVG */}
          <svg viewBox="0 0 500 500" className="w-full max-w-[480px] drop-shadow-[0_0_35px_rgba(34,211,238,0.2)]">
            <defs>
              <radialGradient id="earthQuantumGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#083344" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#020617" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="quantumPhotonBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Earth Core Surface Circle */}
            <circle cx="250" cy="250" r="90" fill="url(#earthQuantumGlow)" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="180" fill="none" stroke="#0e7490" strokeWidth="1" strokeDasharray="2 6" opacity="0.4" />

            {/* Earth Label */}
            <text x="250" y="246" textAnchor="middle" fill="#64748b" fontSize="8px" fontFamily="monospace" fontWeight="bold">
              TERRESTRIAL_OGS_GRID
            </text>
            <text x="250" y="258" textAnchor="middle" fill="#0891b2" fontSize="7px" fontFamily="monospace" fontWeight="bold">
              FIBER_&_OPTICAL_SURFACE
            </text>

            {/* Entanglement Channels (Links) */}
            {channels.map((ch, idx) => {
              const p1 = graphLayout[ch.fromId];
              const p2 = graphLayout[ch.toId];
              if (!p1 || !p2) return null;

              const isSwapped = ch.isSwapped;
              const isSelectedLink = ch.fromId === selectedNodeId || ch.toId === selectedNodeId;

              return (
                <g key={`ch-${idx}`}>
                  {/* Outer Glow Line */}
                  <line 
                    x1={p1.x} y1={p1.y} 
                    x2={p2.x} y2={p2.y}
                    stroke={isSwapped ? '#a855f7' : (isSelectedLink ? '#22d3ee' : '#0891b2')}
                    strokeWidth={isSwapped ? 3 : (isSelectedLink ? 2.5 : 1.2)}
                    strokeDasharray={isSwapped ? '4 2' : 'none'}
                    opacity={isSelectedLink ? 0.9 : 0.45}
                  />

                  {/* Traveling Quantum Photon Particles */}
                  <motion.circle 
                    r={isSwapped ? 4 : 3}
                    fill={isSwapped ? '#d8b4fe' : '#38bdf8'}
                    animate={{
                      cx: [p1.x, p2.x, p1.x],
                      cy: [p1.y, p2.y, p1.y]
                    }}
                    transition={{
                      duration: 3 + (idx % 3),
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  {/* Bell State label on link */}
                  {isSelectedLink && (
                    <text 
                      x={(p1.x + p2.x) / 2} 
                      y={(p1.y + p2.y) / 2 - 6}
                      textAnchor="middle"
                      fill={isSwapped ? '#c084fc' : '#22d3ee'}
                      fontSize="9px"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {ch.bellState}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Quantum Nodes */}
            {(Object.values(graphLayout) as { x: number; y: number; node: QuantumNode }[]).map((item) => {
              const { x, y, node } = item;
              const isSelected = node.id === selectedNodeId;
              const isSpace = node.type === 'QKD_SATELLITE' || node.type === 'ORBITAL_REPEATER';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    audioController.playChirp();
                  }}
                >
                  {/* Selected Ripple */}
                  {isSelected && (
                    <circle r="16" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="animate-ping opacity-40" />
                  )}

                  {/* Node Base Ring */}
                  <circle 
                    r={isSelected ? 10 : 7} 
                    fill={isSpace ? '#0284c7' : '#059669'}
                    stroke={isSelected ? '#ffffff' : (isSpace ? '#38bdf8' : '#34d399')}
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-all"
                  />

                  {/* Node Icon Center Dot */}
                  <circle 
                    r={isSelected ? 4 : 2.5} 
                    fill="#030712"
                  />

                  {/* Label */}
                  <text 
                    x={x > 250 ? 12 : -12} 
                    y="3"
                    textAnchor={x > 250 ? 'start' : 'end'}
                    fill={isSelected ? '#ffffff' : '#94a3b8'}
                    fontSize={isSelected ? '9px' : '7.5px'}
                    fontFamily="monospace"
                    fontWeight="bold"
                    filter="drop-shadow(0 0 4px black)"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Interactive Trigger Controls */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between flex-wrap gap-2 z-10 pt-2 border-t border-slate-800/60">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTriggerEntanglementSwap}
                disabled={isSwappingActive}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] disabled:opacity-50"
              >
                <Share2 className={`w-3 h-3 ${isSwappingActive ? 'animate-spin' : ''}`} />
                <span>{isSwappingActive ? 'SWAPPING...' : 'Trigger_Entanglement_Swap'}</span>
              </button>

              <button
                onClick={handleRunQKD}
                disabled={isQkdRunning}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50"
              >
                <Zap className="w-3 h-3" />
                <span>{isQkdRunning ? 'EXCHANGING_KEYS...' : 'Execute_QKD_Session'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePurgeDecoherence}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[9px] font-bold uppercase transition-all"
                title="Purge Decoherence across all registers"
              >
                Purge_Decoherence
              </button>

              <button
                onClick={handleExportTopology}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-xl text-[9px] font-bold uppercase transition-all flex items-center space-x-1"
                title="Export Quantum Dossier"
              >
                <Download className="w-3 h-3" />
                <span>Export_Dossier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Selected Quantum Node Telemetry & Bloch Coordinates */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Node Detail Card */}
          {activeNode && (
            <div className="glass p-6 rounded-[2rem] border border-slate-800 bg-slate-950/80 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm font-black text-white uppercase">{activeNode.name}</span>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{activeNode.id}</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {activeNode.status}
                </span>
              </div>

              {/* Node Role & Hardware Tech */}
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 text-[9px] space-y-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-slate-500 uppercase">Hardware Tech:</span>
                  <span className="text-white font-bold">{activeNode.qubitTech}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-slate-500 uppercase">Qubit Register:</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    {activeNode.qubitCapacity} Physical / {activeNode.logicalQubits} Logical
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-slate-500 uppercase">Cryogenic Temp:</span>
                  <span className="text-emerald-400 font-bold font-mono">{activeNode.cryoTemp_mK} mK</span>
                </div>
              </div>

              {/* Live Coherence & Error Telemetry */}
              <div className="grid grid-cols-2 gap-3 text-[9px]">
                <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 font-bold block uppercase text-[8px]">T₁ Relaxation Time</span>
                  <span className="text-cyan-400 font-black text-xs font-mono">{activeNode.t1_coherence} μs</span>
                  <span className="text-[7px] text-slate-600 block mt-0.5">Energy decay limit</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 font-bold block uppercase text-[8px]">T₂ Dephasing Time</span>
                  <span className="text-purple-400 font-black text-xs font-mono">{activeNode.t2_dephasing} μs</span>
                  <span className="text-[7px] text-slate-600 block mt-0.5">Phase drift threshold</span>
                </div>
              </div>

              {/* Bloch Sphere State Vectors */}
              <div className="p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center">
                    <Atom className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                    Bloch Sphere Coordinates
                  </span>
                  <span className="text-[8px] font-mono text-cyan-400">|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[8px] block">θ (POLAR ANGLE)</span>
                    <span className="text-slate-200 font-bold">{activeNode.theta.toFixed(4)} rad</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[8px] block">φ (AZIMUTH PHASE)</span>
                    <span className="text-slate-200 font-bold">{activeNode.phi.toFixed(4)} rad</span>
                  </div>
                </div>
              </div>

              {/* Connected Quantum Entanglement Links */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Active Entangled Channels
                </span>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {channels.filter(c => c.fromId === activeNode.id || c.toId === activeNode.id).map((ch, i) => {
                    const peerId = ch.fromId === activeNode.id ? ch.toId : ch.fromId;
                    const peerNode = nodes.find(n => n.id === peerId);
                    return (
                      <div key={i} className="p-2 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center justify-between text-[9px]">
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400 font-black font-mono">{ch.bellState}</span>
                          <span className="text-slate-300 font-bold truncate max-w-[150px]">{peerNode?.name || peerId}</span>
                        </div>
                        <span className="text-emerald-400 font-bold font-mono">{ch.fidelity.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Swap Log & Quantum Operations Log */}
          <div className="glass p-4 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              Quantum Entanglement Swap Audit Log
            </span>
            <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar font-mono text-[8px] text-slate-400">
              {swapHistory.length > 0 ? (
                swapHistory.map((log, i) => (
                  <div key={i} className="text-purple-300 bg-purple-950/20 p-1.5 rounded border border-purple-500/20">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 p-2">
                  No active entanglement swap executed. Click 'Trigger Entanglement Swap' above to connect ground stations.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
