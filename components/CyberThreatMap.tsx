import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

interface Threat {
  id: number;
  x: number;
  y: number;
  type: string;
  intensity: number;
}

const THREAT_TYPES = ['DDOS', 'INTRUSION', 'SPOOFING', 'MALWARE'];

export const CyberThreatMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // PERFORMANCE OPTIMIZATION: Back active threats with useRef to persist threat data
  // within a single requestAnimationFrame loop (useEffect with [] deps).
  // This avoids tearing down and re-registering the rAF loop every frame, prevents resetting
  // the frame counter, batches canvas grid draw paths (1 stroke vs 30+), and syncs React state
  // only on actual threat additions/removals (< 1 FPS React re-renders vs 60 FPS).
  const threatsRef = useRef<Threat[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw world map grid - batched into a single path call
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
      }
      ctx.stroke();

      // Update threat collection
      let updated = false;
      if (frame % 60 === 0 && threatsRef.current.length < 10) {
        threatsRef.current.push({
          id: Date.now() + Math.random(),
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
          intensity: Math.random() * 100
        });
        updated = true;
      }

      // Randomly expire active threat (1% chance per frame)
      if (threatsRef.current.length > 0 && Math.random() < 0.01) {
        const removeIdx = Math.floor(Math.random() * threatsRef.current.length);
        threatsRef.current.splice(removeIdx, 1);
        updated = true;
      }

      // Only trigger React state update when threats array actually changes
      if (updated) {
        setThreats([...threatsRef.current]);
      }

      // Draw active threats on canvas
      const pulse = (Math.sin(frame / 10) + 1) / 2;
      const pulseAlpha = 0.2 + pulse * 0.4;
      ctx.font = 'bold 8px JetBrains Mono';

      const activeThreats = threatsRef.current;
      for (let i = 0; i < activeThreats.length; i++) {
        const t = activeThreats[i];
        ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 10 + pulse * 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillText(`${t.type}_${t.intensity.toFixed(0)}%`, t.x + 10, t.y + 4);
      }

      handle = requestAnimationFrame(animate);
    };

    let handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, []);

  const exportThreatReport = () => {
    if (threats.length === 0) return;
    const report = `
STIA GLOBAL THREAT MATRIX REPORT
--------------------------------
TIMESTAMP: ${new Date().toISOString()}

ACTIVE THREATS:
${threats.map(t => `- [${t.type}] Intensity: ${t.intensity.toFixed(1)}% at COORDS(${t.x.toFixed(0)}, ${t.y.toFixed(0)})`).join('\n')}

STIA_CMD: END_THREAT_LOG
    `.trim();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STIA_Threat_Report_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass p-6 rounded-3xl border-slate-800 bg-slate-950/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Global Cyber Threat Matrix</h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-Time Network Attack Visualization</p>
        </div>
        <div className="flex space-x-3">
           <button 
             onClick={exportThreatReport}
             disabled={threats.length === 0}
             className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-widest transition-all disabled:opacity-20"
           >
             <Download className="w-3 h-3" />
             <span>Export_Matrix</span>
           </button>
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[8px] text-red-500 font-bold uppercase">Active_Threats: {threats.length}</span>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} width="800" height="400" className="w-full h-64 bg-slate-950 rounded-2xl border border-slate-900" />
      <div className="mt-4 grid grid-cols-4 gap-4">
         {THREAT_TYPES.map(type => (
           <div key={type} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
              <span className="text-[7px] text-slate-500 font-bold uppercase">{type}</span>
              <span className="text-xs font-black text-white mono">{threats.filter(t => t.type === type).length}</span>
           </div>
         ))}
      </div>
    </div>
  );
};
