
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { LookAngles } from '../types';

interface Props {
  angles: LookAngles | null;
}

// Optimization: Precompute horizon obstruction levels and trigonometric lookup tables (LUT)
// for azimuth angles 0..359.
// Hoisting these static TypedArrays outside the component prevents allocating a 360-element Array
// and executing 1,440 trigonometric operations on every 60 FPS requestAnimationFrame loop iteration.
const MOCK_BLOCKAGE = new Float64Array(360);
const COS_AZ = new Float64Array(360);
const SIN_AZ = new Float64Array(360);

for (let i = 0; i < 360; i++) {
  const noise = Math.sin(i / 10) * 5 + Math.cos(i / 50) * 15;
  MOCK_BLOCKAGE[i] = Math.max(0, 15 + noise);

  const radAz = (i - 90) * (Math.PI / 180);
  COS_AZ[i] = Math.cos(radAz);
  SIN_AZ[i] = Math.sin(radAz);
}

export const TerrainObstruction: React.FC<Props> = ({ angles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const drawHorizon = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radar rings
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      [0.2, 0.4, 0.6, 0.8, 1.0].forEach(mult => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * mult, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Cardinal axes
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY); ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius); ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Cardinal labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('N', centerX, centerY - radius - 5);
      ctx.fillText('S', centerX, centerY + radius + 15);
      ctx.fillText('E', centerX + radius + 10, centerY + 4);
      ctx.fillText('W', centerX - radius - 10, centerY + 4);

      // Draw obstruction field using precomputed static lookup tables
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let az = 0; az < 360; az++) {
        const blockElev = MOCK_BLOCKAGE[az];
        const dist = radius * (1 - blockElev / 90);
        const x = centerX + COS_AZ[az] * dist;
        const y = centerY + SIN_AZ[az] * dist;
        if (az === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Satellite Target
      if (angles && angles.elevation > 0) {
        const radAz = (angles.azimuth - 90) * (Math.PI / 180);
        const dist = radius * (1 - angles.elevation / 90);
        const tx = centerX + Math.cos(radAz) * dist;
        const ty = centerY + Math.sin(radAz) * dist;

        const isObstructed = angles.elevation < MOCK_BLOCKAGE[Math.round(angles.azimuth) % 360];

        // Pulsing target circle
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.fillStyle = isObstructed ? `rgba(239, 68, 68, ${0.4 + pulse * 0.4})` : `rgba(34, 211, 238, ${0.4 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();

        // Crosshair
        ctx.strokeStyle = isObstructed ? '#ef4444' : '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 10, ty); ctx.lineTo(tx + 10, ty);
        ctx.moveTo(tx, ty - 10); ctx.lineTo(tx, ty + 10);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(isObstructed ? 'OBSTRUCTED' : 'CLEAR_PATH', tx, ty - 15);
      }
    };

    let frameId: number;
    const animate = () => {
      drawHorizon();
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(frameId);
  }, [angles]);

  return (
    <div className="glass p-6 rounded-2xl border-slate-800 bg-slate-950/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Terrain Obstruction Analysis</h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon-to-Space Scanning Matrix</p>
        </div>
        <div className="flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-red-500"></div>
           <span className="text-[8px] text-slate-400 font-bold uppercase">Blockage</span>
        </div>
      </div>
      <div className="flex justify-center">
        <canvas ref={canvasRef} width="300" height="300" className="max-w-full h-auto" />
      </div>
      <div className="mt-6 p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[10px] mono text-slate-400 leading-relaxed italic">
        {angles && angles.elevation > 0 
          ? `Analysis: Current target is positioned at ${angles.azimuth.toFixed(1)}° Azimuth. Local site scanning shows ${angles.elevation < 20 ? 'critical' : 'minimal'} risk of Fresnel zone obstruction by physical structures.`
          : 'Status: Awaiting active satellite link coordinates for site-path computation.'}
      </div>
    </div>
  );
};
