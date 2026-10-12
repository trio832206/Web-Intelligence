import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Activity, CheckCircle, Database, Server } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CyberBootSequence({ onComplete, currentUser }) {
  const { theme, accent } = useTheme();
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const canvasRef = useRef(null);

  const userEmail = currentUser?.email || 'authenticated_user';

  const bootLogs = [
    { tag: 'SYS_BOOT', text: 'Initializing Web Intelligence Terminal Kernel v2.4.0...' },
    { tag: 'MEM_CHK',  text: 'Allocating virtual memory heap buffers: 512MB [OK]' },
    { tag: 'TLS_SOCK', text: 'Establishing secure TLS 1.3 socket handshake...' },
    { tag: 'DB_ATLAS', text: 'Connecting to MongoDB Atlas distributed cluster... CONNECTED' },
    { tag: 'CRAWLER',  text: 'Spawning crawler workers & headless browser pool...' },
    { tag: 'NLP_MOD',  text: 'Loading sentiment analyzer & named entity recognition models...' },
    { tag: 'SEC_AUTH', text: `Validating clearance token for <${userEmail}>... AUTHORIZED` },
    { tag: 'UI_READY', text: 'Compiling dashboard metrics and telemetry views... READY' }
  ];

  // Cyber Canvas Matrix / Network Lines in background of boot screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Accent RGB helper
    let rgb = '0, 255, 102'; // default green
    if (accent === 'crimson') rgb = theme === 'dark' ? '255, 42, 95' : '190, 18, 60';
    else if (accent === 'cyan') rgb = '0, 240, 255';
    else if (accent === 'amber') rgb = '255, 176, 0';
    else if (accent === 'monochrome') rgb = theme === 'dark' ? '240, 240, 240' : '15, 23, 42';
    else if (theme === 'light') rgb = '4, 120, 87';

    // Grid coordinates and packet nodes
    const nodes = Array.from({ length: 32 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      pulse: Math.random() * Math.PI
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Cyber Grid
      const gridSize = 48;
      ctx.strokeStyle = `rgba(${rgb}, ${theme === 'dark' ? 0.05 : 0.04})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Connecting Network Pulses
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.04;

        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;

        ctx.fillStyle = `rgba(${rgb}, ${0.4 + 0.3 * Math.sin(n.pulse)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / 140) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [theme, accent]);

  // Stepped log reveals and progress bar
  useEffect(() => {
    const totalDuration = 2200; // 2.2 seconds total boot time
    const intervalTime = 40;
    const step = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 350);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Reveal logs as progress increases
  useEffect(() => {
    const targetIdx = Math.min(
      bootLogs.length,
      Math.floor((progress / 100) * bootLogs.length) + 1
    );
    setLogIndex(targetIdx);
  }, [progress, bootLogs.length]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-mono)',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Background Cyber Network Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Terminal Main Window */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '680px',
          padding: '28px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
          border: '1px solid var(--neon-accent)'
        }}
      >
        {/* Terminal Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-glow)',
            paddingBottom: '14px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="radar-pulse" />
            <Terminal size={18} color="var(--neon-accent)" />
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.88rem',
                letterSpacing: '0.06em',
                color: 'var(--neon-accent)'
              }}
            >
              SYSTEM_BOOT // INITIALIZING
            </span>
          </div>

          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-glow)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            [ Skip → ]
          </button>
        </div>

        {/* Boot Logs Terminal Screen */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-glow)',
            borderRadius: '6px',
            padding: '16px',
            height: '240px',
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '8px',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.3)'
          }}
        >
          {bootLogs.slice(0, logIndex).map((log, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '10px',
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <span
                style={{
                  color: 'var(--neon-accent)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  minWidth: '85px'
                }}
              >
                [{log.tag}]
              </span>
              <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>
                {log.text}
              </span>
            </div>
          ))}
          {logIndex < bootLogs.length && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-accent)' }}>
              <span style={{ animation: 'blink 0.8s infinite' }}>▋</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Status */}
        <div style={{ marginTop: '22px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              {progress >= 100 ? 'SYSTEM READY' : 'MOUNTING_SYSTEM_MODULES...'}
            </span>
            <span style={{ color: 'var(--neon-accent)', fontWeight: 700 }}>
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glow)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--neon-accent)',
                boxShadow: '0 0 10px var(--neon-accent)',
                transition: 'width 0.05s linear'
              }}
            />
          </div>
        </div>

        {/* System Node Hardware Indicator Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-glow)',
            fontSize: '0.72rem',
            color: 'var(--text-dim)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Server size={12} color="var(--neon-green)" /> ATLAS_CLUSTER: ONLINE
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} color="var(--neon-accent)" /> V8_ENGINE: ACTIVE
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} color="var(--neon-cyan)" /> CRYPTO: SECURE
          </span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
