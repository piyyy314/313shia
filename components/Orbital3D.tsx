import * as React from 'react';
import { useEffect, useRef } from 'react';

// Precomputed trigonometric constants and steps for 60 FPS animation loop
const TWO_PI = Math.PI * 2;
const HALF_PI_STEP = Math.PI / 8;
const INCLINATION = Math.PI / 6;
const COS_INCLINATION = Math.cos(INCLINATION);
const SIN_INCLINATION = Math.sin(INCLINATION);

export const Orbital3D: React.FC<{ longitude: number }> = ({ longitude }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const orbitRx = Math.max(0.1, radius * 2.5);
    const orbitRy = Math.max(0.1, radius * 0.8);

    // Performance Optimization: Precompute Earth sphere radial gradient once outside the 60 FPS loop
    // to avoid allocating 60 CanvasGradient objects per second on the heap.
    const earthGradient = ctx.createRadialGradient(centerX - 20, centerY - 20, 10, centerX, centerY, radius);
    earthGradient.addColorStop(0, '#1e293b');
    earthGradient.addColorStop(1, '#020617');

    // Pre-set static canvas text font property once to prevent font string parsing on every frame
    ctx.font = 'bold 8px JetBrains Mono';

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Earth (3D sphere projection) using precomputed radial gradient
      ctx.fillStyle = earthGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, TWO_PI);
      ctx.fill();

      // Draw Grid lines (Longitude/Latitude)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < Math.PI; i += HALF_PI_STEP) {
        ctx.beginPath();
        const rx = Math.max(0.1, Math.abs(radius * Math.sin(i + frame * 0.01)));
        ctx.ellipse(centerX, centerY, rx, radius, 0, 0, TWO_PI);
        ctx.stroke();
      }

      // Draw Satellite Orbit
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, orbitRx, orbitRy, INCLINATION, 0, TWO_PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Satellite position
      const satAngle = (frame * 0.02) % TWO_PI;
      const dx = Math.cos(satAngle) * orbitRx;
      const dy = Math.sin(satAngle) * orbitRy;
      
      // Rotate sat position by orbit inclination using precomputed trigonometric values
      const rotatedX = centerX + dx * COS_INCLINATION - dy * SIN_INCLINATION;
      const rotatedY = centerY + dx * SIN_INCLINATION + dy * COS_INCLINATION;

      ctx.fillStyle = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#22d3ee';
      ctx.beginPath();
      ctx.arc(rotatedX, rotatedY, 4, 0, TWO_PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = '#fff';
      ctx.fillText("TARGET_ASSET", rotatedX + 8, rotatedY + 4);

      requestAnimationFrame(animate);
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [longitude]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width="400" height="300" className="w-full h-auto" />
      <div className="absolute top-4 left-4">
         <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Orbital_Projection_v4</p>
         <p className="text-[8px] text-slate-500 font-bold uppercase">Real-Time TLE Propagation</p>
      </div>
    </div>
  );
};
