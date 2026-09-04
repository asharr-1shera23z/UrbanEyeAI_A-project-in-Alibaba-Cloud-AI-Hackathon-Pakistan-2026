import { useEffect, useRef } from 'react';

const NODE_COUNT = 55;
const CONNECTION_DISTANCE = 170;
const PULSE_SPEED = 0.0015;

// Dark blue palette — visible but softened so hero text stays readable
const NAVY = { r: 21, g: 42, b: 79 };
const BLUE_600 = { r: 37, g: 99, b: 235 };
const BLUE_500 = { r: 59, g: 130, b: 246 };

function generateNodes(width: number, height: number) {
  return Array.from({ length: NODE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    radius: Math.random() * 2 + 2.5,
    pulsePhase: Math.random() * Math.PI * 2,
  }));
}

export function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    let time = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = generateNodes(width, height);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += PULSE_SPEED;

      // Update positions
      for (const a of nodes) {
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;
      }

      // Draw connections with subtle pulse
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const baseAlpha = 0.20 * (1 - dist / CONNECTION_DISTANCE);
            const pulse = 0.06 * Math.sin(time + a.pulsePhase + b.pulsePhase);
            const alpha = Math.max(0.06, baseAlpha + pulse);
            const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `rgba(${NAVY.r}, ${NAVY.g}, ${NAVY.b}, ${alpha})`);
            gradient.addColorStop(1, `rgba(${BLUE_600.r}, ${BLUE_600.g}, ${BLUE_600.b}, ${alpha})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // Draw nodes on top with soft pulse glow
      for (const node of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.5 + node.pulsePhase);
        const radius = node.radius + pulse * 0.6;
        const glowAlpha = 0.25 + pulse * 0.2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BLUE_600.r}, ${BLUE_600.g}, ${BLUE_600.b}, 0.65)`;
        ctx.shadowColor = `rgba(${BLUE_500.r}, ${BLUE_500.g}, ${BLUE_500.b}, ${glowAlpha})`;
        ctx.shadowBlur = 8 + pulse * 4;
        ctx.fill();
        ctx.shadowBlur = 0;
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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-55 pointer-events-none"
    />
  );
}
