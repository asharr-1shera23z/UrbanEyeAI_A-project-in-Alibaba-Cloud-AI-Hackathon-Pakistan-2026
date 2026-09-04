import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const NODE_COUNT = 28;

function generateNodes() {
  return Array.from({ length: NODE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1.5,
    duration: Math.random() * 20 + 25,
    delay: Math.random() * -30,
  }));
}

const nodes = generateNodes();

export function AIBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodeStates = nodes.map((n) => ({
      x: (n.x / 100) * width,
      y: (n.y / 100) * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodeStates.length; i++) {
        const a = nodeStates[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        for (let j = i + 1; j < nodeStates.length; j++) {
          const b = nodeStates[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const alpha = 0.12 * (1 - dist / 200);
            const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `rgba(6, 182, 212, ${alpha})`);
            gradient.addColorStop(1, `rgba(59, 130, 246, ${alpha})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, nodes[i].size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Soft gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/50" />

      {/* Animated orbs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/25 to-cyan-200/20 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-48 -left-48 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-200/20 to-blue-200/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-200/20 blur-3xl"
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,29,58,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(13,29,58,0.35) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Connecting nodes canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />

      {/* Subtle hexagon pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%230d1d3a' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-7.5L27.99 34H28v2.31h-.01L17 42.65V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* AI pulse rings */}
      <div className="absolute top-1/4 right-1/4">
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
          className="w-24 h-24 rounded-full border border-blue-400/30 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
          className="w-24 h-24 rounded-full border border-cyan-400/30 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
