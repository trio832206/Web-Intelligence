import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PortalBackground() {
  const canvasRef = useRef(null);
  const { theme, accent } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Accent RGB Mapping
    let rgb = '0, 255, 102'; // default green
    if (accent === 'crimson') rgb = theme === 'dark' ? '255, 42, 95' : '190, 18, 60';
    else if (accent === 'cyan') rgb = '0, 240, 255';
    else if (accent === 'amber') rgb = '255, 176, 0';
    else if (accent === 'monochrome') rgb = theme === 'dark' ? '240, 240, 240' : '15, 23, 42';
    else if (theme === 'light') rgb = '4, 120, 87';

    const isDark = theme === 'dark';

    // Cyber Network Nodes
    const nodeCount = Math.floor((width * height) / 22000);
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI
      });
    }

    // Data Packets moving across network links
    const packets = [];
    for (let i = 0; i < 8; i++) {
      packets.push({
        from: Math.floor(Math.random() * nodeCount),
        to: Math.floor(Math.random() * nodeCount),
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.012
      });
    }

    let gridOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Terminal Grid & Crosshairs
      const gridSize = 64;
      ctx.save();
      ctx.strokeStyle = isDark ? `rgba(255, 255, 255, 0.02)` : `rgba(0, 0, 0, 0.03)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Terminal Coordinate Crosshairs at intersections
      ctx.strokeStyle = isDark ? `rgba(${rgb}, 0.08)` : `rgba(${rgb}, 0.06)`;
      const crossSize = 3;
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. Cyber Network Nodes & Connections
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.03;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        const currentAlpha = n.alpha + Math.sin(n.pulse) * 0.15;
        ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.1, currentAlpha * (isDark ? 0.8 : 0.6))})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * (isDark ? 0.12 : 0.08);
            ctx.strokeStyle = `rgba(${rgb}, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Routing Data Packets
      for (let p = 0; p < packets.length; p++) {
        const pkt = packets[p];
        const n1 = nodes[pkt.from];
        const n2 = nodes[pkt.to];
        if (n1 && n2) {
          pkt.progress += pkt.speed;
          if (pkt.progress >= 1) {
            pkt.progress = 0;
            pkt.from = pkt.to;
            pkt.to = Math.floor(Math.random() * nodes.length);
          }

          const px = n1.x + (n2.x - n1.x) * pkt.progress;
          const py = n1.y + (n2.y - n1.y) * pkt.progress;

          ctx.fillStyle = `rgba(${rgb}, ${isDark ? 0.85 : 0.7})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, accent]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: theme === 'dark' ? 0.85 : 0.9
      }}
    />
  );
}
