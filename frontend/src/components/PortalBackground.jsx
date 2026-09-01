import React, { useEffect, useRef } from 'react';
const PortalBackground = ({
  onComplete
}) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    const setSize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // ── Load the absolute reference image ─────────────────────────────────────
    const bgImg = new Image();
    // We will assign src at the very end to prevent onload race conditions

    // ── Intense God Rays ──────────────────────────────────────────────────────
    const NUM_RAYS = 25;
    const RAY_ANGLE = Math.PI / 4; // 45 degree angle (top-left to bottom-right)

    const rays = Array.from({
      length: NUM_RAYS
    }).map(() => {
      const isTop = Math.random() > 0.5;
      return {
        x: isTop ? Math.random() * W : -100,
        // Top edge or Left edge
        y: isTop ? -100 : Math.random() * H,
        width: Math.random() * 100 + 20,
        // Some wide, some narrow
        length: Math.random() * 1500 + 1000,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        maxAlpha: Math.random() * 0.6 + 0.3 // Intense!
      };
    });

    // ── Animation Loop ────────────────────────────────────────────────────────
    let raf = 0;
    let frame = 0;
    let done = false;
    const INTRO_DURATION = 180; // 3 seconds
    const FADE_DURATION = 60; // 1 second fade

    const tick = () => {
      if (done) return;
      frame++;

      // Calculate global fade-out
      let globalAlpha = 1;
      if (frame > INTRO_DURATION) {
        globalAlpha = Math.max(0, 1 - (frame - INTRO_DURATION) / FADE_DURATION);
      }

      // 1. Draw locked static background
      if (bgImg.complete && bgImg.width > 0) {
        const imgRatio = bgImg.width / bgImg.height;
        const screenRatio = W / H;
        let drawW = W;
        let drawH = H;
        let drawX = 0;
        let drawY = 0;
        if (screenRatio > imgRatio) {
          drawH = W / imgRatio;
          drawY = (H - drawH) / 2;
        } else {
          drawW = H * imgRatio;
          drawX = (W - drawW) / 2;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

        // Apply global fade-out for effects
        ctx.globalAlpha = globalAlpha;

        // 2. God Rays (Sun rays for light, Moon rays for dark)
        ctx.globalCompositeOperation = isDark ? 'screen' : 'color-dodge';
        rays.forEach(ray => {
          ray.phase += ray.speed;
          const sinVal = Math.sin(ray.phase);
          if (sinVal < 0) {
            if (sinVal < -0.99) {
              const isTop = Math.random() > 0.5;
              ray.x = isTop ? Math.random() * W : -100;
              ray.y = isTop ? -100 : Math.random() * H;
            }
            return;
          }
          const alpha = Math.pow(sinVal, 2) * ray.maxAlpha;
          ctx.save();
          ctx.translate(ray.x, ray.y);
          ctx.rotate(RAY_ANGLE);

          // Draw a long, soft-edged rectangle for the god ray
          const grd = ctx.createLinearGradient(0, -ray.width / 2, 0, ray.width / 2);
          if (isDark) {
            // Moon rays (Cool blue/silver)
            grd.addColorStop(0, 'rgba(200, 220, 255, 0)');
            grd.addColorStop(0.5, `rgba(220, 240, 255, ${alpha * 0.7})`);
            grd.addColorStop(1, 'rgba(200, 220, 255, 0)');
          } else {
            // Sun rays (Warm gold)
            grd.addColorStop(0, 'rgba(255, 230, 150, 0)');
            grd.addColorStop(0.5, `rgba(255, 245, 200, ${alpha})`);
            grd.addColorStop(1, 'rgba(255, 230, 150, 0)');
          }
          ctx.fillStyle = grd;

          // Fade ray length-wise
          const lengthGrd = ctx.createLinearGradient(0, 0, ray.length, 0);
          lengthGrd.addColorStop(0, 'rgba(255,255,255,1)');
          lengthGrd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalCompositeOperation = isDark ? 'screen' : 'color-dodge';
          ctx.fillRect(0, -ray.width / 2, ray.length, ray.width);
          ctx.restore();
        });
        ctx.globalAlpha = 1; // restore
      }
      if (frame >= INTRO_DURATION + FADE_DURATION) {
        done = true;
        if (onComplete) onComplete();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const startAnimation = () => {
      raf = requestAnimationFrame(tick);
    };
    if (bgImg.complete && bgImg.src) {
      startAnimation();
    } else {
      bgImg.onload = startAnimation;
    }
    bgImg.src = isDark ? '/dark_tulip_bg.jpg' : '/new_light_bg.jpg';
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setSize);
    };
  }, [onComplete]);
  return <canvas ref={canvasRef} style={{
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    pointerEvents: 'none',
    display: 'block'
  }} />;
};
export default PortalBackground;