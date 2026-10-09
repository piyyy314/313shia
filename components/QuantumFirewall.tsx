import * as React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock } from 'lucide-react';
import { audioController } from '../services/audioService';

export const QuantumFirewall: React.FC = () => {
    const [sessionToken, setSessionToken] = React.useState<string | null>(null);
    const [autoRotate, setAutoRotate] = React.useState<boolean>(false);

    const generateToken = React.useCallback(() => {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        setSessionToken(token);
        audioController.playChirp();
    }, []);

    React.useEffect(() => {
        if (!autoRotate) return;
        const interval = setInterval(generateToken, 60000);
        return () => clearInterval(interval);
    }, [autoRotate, generateToken]);

    return (
        <div className="glass p-8 rounded-3xl border border-slate-800 space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Quantum Firewall Core</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Real-time Entanglement Filtering</p>
                </div>
                <ShieldCheck className="w-12 h-12 text-cyan-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-6 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center">
                    <svg width="200" height="200" viewBox="0 0 100 100" className="text-cyan-500">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                        <motion.path
                            d="M 50 10 A 40 40 0 1 1 49.9 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <circle cx="50" cy="50" r="10" fill="transparent" stroke="white" strokeWidth="1" />
                        <motion.circle
                            cx="50" cy="50" r="5" fill="white"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </svg>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-4">Tunnel Establishment Status</p>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] uppercase font-bold text-slate-400">Packet Filtering (PPS)</span>
                             <span className="text-sm mono font-black text-white">42,091</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-cyan-500" initial={{ width: "30%" }} animate={{ width: "85%" }} transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }} />
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] uppercase font-bold text-slate-400">Threats Neutralized</span>
                             <span className="text-sm mono font-black text-rose-500">1,337</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-rose-500" initial={{ width: "10%" }} animate={{ width: "95%" }} transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Quantum Entropy Key Export</h3>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase cursor-pointer">
                            <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} className="accent-cyan-500" />
                            Auto-Rotate (60s)
                        </label>
                        <Lock className="w-4 h-4 text-cyan-400" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={generateToken}
                        className="px-4 py-2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-bold uppercase transition hover:bg-cyan-900 cursor-pointer"
                    >
                        Generate Secure Token
                    </button>
                    {sessionToken && (
                        <button 
                            onClick={() => navigator.clipboard.writeText(sessionToken)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold uppercase transition hover:bg-slate-700 cursor-pointer"
                        >
                            Copy
                        </button>
                    )}
                </div>
                {sessionToken && (
                    <div className="p-3 bg-black rounded-lg border border-slate-800 font-mono text-[10px] text-cyan-500 break-all">
                        {sessionToken}
                    </div>
                )}
            </div>
        </div>
    );
};
