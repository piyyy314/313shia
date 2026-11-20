import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Link as LinkIcon, Zap, Shield, Cpu, Activity, Download, Atom, Layers } from 'lucide-react';
import { Satellite } from '../types';
import { QuantumTopologyVisualizer } from './QuantumTopologyVisualizer';
import { audioController } from '../services/audioService';

interface MeshLink {
  fromIdx: number;
  toIdx: number;
  strength: number;
  active: boolean;
  quantumEntangled?: boolean;
}

export const ConnectivityMesh: React.FC<{ satellites: Satellite[], selectedSat: Satellite }> = ({ satellites, selectedSat }) => {
  const [links, setLinks] = useState<MeshLink[]>([]);
  const [meshMode, setMeshMode] = useState<'CLASSICAL' | 'QUANTUM' | 'HYBRID'>('QUANTUM');

  useEffect(() => {
    // Generate inter-satellite links
    const newLinks: MeshLink[] = [];
    for (let i = 0; i < satellites.length; i++) {
      // Connect to next 2 satellites to form a ring/mesh
      for (let j = 1; j <= 2; j++) {
        newLinks.push({
          fromIdx: i,
          toIdx: (i + j) % satellites.length,
          strength: 0.5 + Math.random() * 0.5,
          active: Math.random() > 0.1,
          quantumEntangled: (i + j) % 2 === 0
        });
      }
    }
    setLinks(newLinks);
    // Bolt Optimization: Removed unused rotation state and 50ms (20 Hz) setInterval loop.
    // The rotation state was never rendered in the DOM/JSX, yet triggered 20 full component
    // re-renders per second (1,200 per minute) including all child trees and SVGs.
  }, [satellites.length]);

  const exportMeshReport = () => {
    if (satellites.length === 0) return;
    const report = `
STIA CONSTELLATION MESH TOPOLOGY // DUAL-LAYER TELEMETRY
-------------------------------------------------------
TIMESTAMP: ${new Date().toISOString()}
MODE: ${meshMode}

ACTIVE SATELLITES:
${satellites.map(s => `- ${s.name} (${s.operator}) | Latency: 142ms | Quantum-Ready: YES`).join('\n')}

TOPOLOGY LINKS:
${links.map(l => `- Link: ${satellites[l.fromIdx]?.name} <-> ${satellites[l.toIdx]?.name} (Active: ${l.active}, Entangled: ${l.quantumEntangled})`).join('\n')}

STIA_CMD: END_MESH_LOG
    `.trim();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STIA_Mesh_Topology_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    audioController.playChirp();
  };

  const centerX = 200;
  const centerY = 200;
  const radius = 140;

  const points = useMemo(() => {
    return satellites.map((sat, i) => {
      const angle = (i / satellites.length) * Math.PI * 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        sat
      };
    });
  }, [satellites, radius]);

  const selectedIdx = satellites.findIndex(s => s.id === selectedSat.id);

  return (
    <div className="space-y-6">
      {/* Topology Mode Navigation Tabs */}
      <div className="glass p-4 rounded-[2rem] border-2 border-slate-800 bg-slate-950/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Network Mesh <span className="text-cyan-400">Topology Architecture</span>
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              L1 RF Physical // L2 Quantum Entanglement Channels
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setMeshMode('CLASSICAL');
              audioController.playChirp();
            }}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              meshMode === 'CLASSICAL'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Classical ISL</span>
          </button>

          <button
            onClick={() => {
              setMeshMode('QUANTUM');
              audioController.playChirp();
            }}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              meshMode === 'QUANTUM'
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Atom className="w-3 h-3 animate-spin-slow" />
            <span>Quantum Topology</span>
          </button>

          <button
            onClick={() => {
              setMeshMode('HYBRID');
              audioController.playChirp();
            }}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              meshMode === 'HYBRID'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Hybrid Dual-Layer</span>
          </button>
        </div>
      </div>

      {/* Render Selected Topology Mode */}
      {meshMode === 'QUANTUM' && (
        <div className="animate-in fade-in duration-500">
          <QuantumTopologyVisualizer 
            satellites={satellites}
            selectedSat={selectedSat}
          />
        </div>
      )}

      {(meshMode === 'CLASSICAL' || meshMode === 'HYBRID') && (
        <div className="glass p-8 rounded-[2.5rem] border-slate-800 bg-slate-950/60 transition-all duration-700 animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
                <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 mr-4">
                  <Globe className="w-6 h-6 text-cyan-500" />
                </span>
                Global <span className="text-cyan-500 ml-2">Constellation Mesh</span>
                {meshMode === 'HYBRID' && (
                  <span className="ml-3 px-2 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    + QUANTUM EPR CHANNELS
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 ml-1">
                Cross-Link Layer 2 Topology // Real-Time Routing
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-600 font-bold uppercase">Mesh_Integrity</span>
                <span className="text-sm font-black text-emerald-500 mono tracking-widest">99.999%</span>
              </div>
              <div className="w-px h-10 bg-slate-800"></div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-600 font-bold uppercase">Average_Latency</span>
                <span className="text-sm font-black text-cyan-400 mono tracking-widest">142ms ISL</span>
              </div>
              <div className="w-px h-10 bg-slate-800"></div>
              <button
                onClick={exportMeshReport}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-xl transition-all"
                title="Export Constellation Mesh Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex justify-center relative">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <svg viewBox="0 0 400 400" className="w-full max-w-[400px] drop-shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                {/* Earth Circle */}
                <circle cx={centerX} cy={centerY} r={radius * 0.6} className="fill-slate-900 stroke-slate-800" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Links */}
                {links.map((link, i) => {
                  const p1 = points[link.fromIdx];
                  const p2 = points[link.toIdx];
                  if (!p1 || !p2) return null;

                  const isSelectedLink = link.fromIdx === selectedIdx || link.toIdx === selectedIdx;
                  const isEntangled = meshMode === 'HYBRID' && link.quantumEntangled;
                  
                  return (
                    <motion.line
                      key={i}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={isEntangled ? '#c084fc' : (isSelectedLink ? '#22d3ee' : '#1e293b')}
                      strokeWidth={isEntangled ? 2.5 : (isSelectedLink ? 2 : 1)}
                      strokeDasharray={isEntangled ? '4 2' : 'none'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isSelectedLink || isEntangled ? [0.4, 0.9, 0.4] : 0.2 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  );
                })}

                {/* Nodes */}
                {points.map((p, i) => {
                  const isSelected = i === selectedIdx;
                  return (
                    <g key={i}>
                      <motion.circle
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? 6 : 3}
                        className={isSelected ? 'fill-cyan-500 shadow-xl' : 'fill-slate-700'}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.5 }}
                      />
                      {isSelected && (
                        <circle cx={p.x} cy={p.y} r={12} className="stroke-cyan-500 fill-none opacity-30 animate-ping" />
                      )}
                      {isSelected && (
                        <text x={p.x + 10} y={p.y + 4} className="fill-cyan-400 text-[8px] font-black uppercase mono">{p.sat.name}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="glass p-6 rounded-3xl border-slate-800 bg-slate-950/40">
                <div className="flex items-center space-x-3 mb-6">
                  <Cpu className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Parameters</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Uplink Power', val: '42.5 dBW', sub: 'Saturation Impending' },
                    { label: 'Beam Convergence', val: '0.04°', sub: 'High Precision' },
                    { label: 'Inter-Sat Bandwidth', val: '1.2 Tbps', sub: 'Optic Backbone' },
                    ...(meshMode === 'HYBRID' ? [{ label: 'Quantum Entanglement', val: '99.4% Fidelity', sub: 'Bell State Channel Active' }] : [])
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 group hover:border-cyan-500/40 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase">{item.label}</span>
                        <span className="text-[11px] font-black text-cyan-400 mono">{item.val}</span>
                      </div>
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{item.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-cyan-500/20 transition-all"></div>
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Routing Analysis</span>
                </div>
                <p className="text-[11px] text-slate-300 font-bold leading-relaxed mb-4">
                  Multi-hop routing discovered for target {selectedSat.name}. Optimal path calculated through {satellites[Math.floor(Math.random() * satellites.length)]?.name || 'RELAY-NODE'}.
                </p>
                <button 
                  onClick={() => audioController.playChirp()}
                  className="w-full py-3 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-cyan-500/30"
                >
                  Execute_Relay_Handoff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
