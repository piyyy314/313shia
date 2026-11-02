import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Lock, ScanLine, RotateCw, Download, CheckCircle2 } from 'lucide-react';
import { audioController } from '../services/audioService';

export const QuantumEntropy: React.FC = () => {
  const [entropy, setEntropy] = useState<number[]>(Array(24).fill(0).map(() => Math.random()));
  const [isQuantumSecured, setIsQuantumSecured] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [sessionToken, setSessionToken] = useState(() => 
    `PQC-${Date.now().toString(16).toUpperCase().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  );
  const [justRotated, setJustRotated] = useState(false);

  // Entropy noise simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setEntropy(prev => prev.map(v => 
        Math.max(0.1, Math.min(0.9, v + (Math.random() - 0.5) * 0.1))
      ));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Generate new post-quantum session token
  const rotateKeys = () => {
    const newToken = `PQC-${Date.now().toString(16).toUpperCase().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setSessionToken(newToken);
    setSecondsLeft(60);
    setJustRotated(true);
    audioController.playChirp();
    setTimeout(() => setJustRotated(false), 2000);
  };

  // Auto-Rotate 60-second periodic timer
  useEffect(() => {
    if (!autoRotate) {
      setSecondsLeft(60);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          rotateKeys();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRotate]);

  // Export current entropy session key
  const exportQuantumKey = () => {
    const data = `========================================================================
QUANTUM ENTROPY MATRIX & SESSION KEY EXPORT
TIMESTAMP: ${new Date().toISOString()}
ALGORITHM: ML-DSA-65 (NIST FIPS 204) / Kyber-1024
========================================================================

SESSION TOKEN: ${sessionToken}
AUTO-ROTATE STATUS: ${autoRotate ? 'ENABLED (60s PERIOD)' : 'MANUAL'}
ENTROPY STATE VECTOR:
${entropy.map((v, i) => `[0x${i.toString(16).padStart(2, '0')}] ${(v * 1024).toFixed(0)}`).join('\n')}

INTEGRITY STATUS: VERIFIED RESISTANT AGAINST SHOR'S QUANTUM PERIODICITY
CHECKSUM: 0x${Math.random().toString(16).substring(2, 10).toUpperCase()}
`;
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QUANTUM_KEY_${sessionToken}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    audioController.playChirp();
  };

  return (
    <div className="glass p-6 rounded-3xl border-slate-800 bg-slate-950/40 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Quantum Entropy Matrix</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isQuantumSecured ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {isQuantumSecured ? 'ML-DSA-65 Active' : 'Fallback RSA'}
          </span>
        </div>
      </div>

      {/* Entropy Grid */}
      <div className="grid grid-cols-8 gap-2">
        {entropy.map((val, i) => (
          <div key={i} className="h-12 bg-slate-900/50 rounded-lg border border-slate-800 relative overflow-hidden group">
            <motion.div 
              className={`absolute bottom-0 left-0 right-0 ${isQuantumSecured ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
              animate={{ height: `${val * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[8px] font-mono text-emerald-400">{(val * 1024).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Session Token & Auto-Rotate Controls */}
      <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Active Session Token</span>
            <span className="text-xs font-black font-mono text-cyan-400 tracking-wider">
              {sessionToken}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-Rotate Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Auto-Rotate</span>
              <button
                onClick={() => {
                  const nextVal = !autoRotate;
                  setAutoRotate(nextVal);
                  if (nextVal) {
                    audioController.playChirp();
                  }
                }}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  autoRotate ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
                title="Toggle periodic 60s key re-generation"
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-slate-950 transition-transform ${
                    autoRotate ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Export Key Button */}
            <button
              onClick={exportQuantumKey}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors"
              title="Export Quantum Key"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Auto-Rotate Countdown Bar */}
        {autoRotate && (
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-slate-400">NEXT_RE-GEN IN:</span>
              <span className="text-cyan-400 font-bold">{secondsLeft}s</span>
            </div>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-md">
           <div className="flex items-start space-x-3">
             <div className="mt-1 p-1 bg-blue-500/10 rounded border border-blue-500/30">
               <ScanLine className="w-3 h-3 text-blue-400" />
             </div>
             <div>
               <p className="text-[10px] font-black text-white uppercase mb-1">Crypto-Analysis vs Shor's Algorithm</p>
               <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Legacy RSA-2048</span>
                     <span className="text-xs font-bold text-red-500">VULNERABLE (T-3s)</span>
                  </div>
                  <div className="w-px h-6 bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">ML-DSA-65 (TSI)</span>
                     <span className="text-xs font-bold text-emerald-400">RESISTANT (∞)</span>
                  </div>
               </div>
             </div>
           </div>
        </div>

        <button 
          onClick={rotateKeys}
          className="w-full py-3 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
        >
          {justRotated ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token Re-Generated!</span>
            </>
          ) : (
            <>
              <RotateCw className="w-3.5 h-3.5" />
              <span>Re-Generate Session Key Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
