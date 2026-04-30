import { useEffect, useRef } from 'react';

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
    return { r: 99, g: 102, b: 241 };
  }

  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const rgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Fondo inmersivo "Abyss": canvas con dos capas — partículas tipo plancton
 * y burbujas que ascienden desde el fondo. Reacciona al cursor con un
 * parallax sutil. Pensado para vivir fixed detrás de todo el contenido.
 *
 * Uso: <AbyssBackground intensity={1.2} tint="rgba(99,102,241,0.85)" />
 */
export const AbyssBackground = ({ intensity = 1, tint = 'rgba(99, 102, 241, 0.85)', mode = 'dark', colors = null }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const compactViewport = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let particles = [];
    let bubbles = [];
    let resizeRaf = null;
    let canvasWidth = 0;
    let canvasHeight = 0;
    const PARTICLE_COUNT = reduceMotion ? 0 : Math.floor((compactViewport ? 34 : 70) * intensity);
    const BUBBLE_COUNT = reduceMotion ? 0 : Math.floor((compactViewport ? 8 : 18) * intensity);

    const resize = (rescale = true) => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;

      if (
        compactViewport &&
        canvasWidth &&
        nextWidth === canvasWidth &&
        Math.abs(nextHeight - canvasHeight) < 96
      ) {
        return;
      }

      const previousWidth = canvasWidth || nextWidth;
      const previousHeight = canvasHeight || nextHeight;
      canvasWidth = nextWidth;
      canvasHeight = nextHeight;
      canvas.width = nextWidth;
      canvas.height = nextHeight;

      if (!rescale || !particles.length) return;

      const scaleX = nextWidth / previousWidth;
      const scaleY = nextHeight / previousHeight;
      particles = particles.map((particle) => ({
        ...particle,
        x: particle.x * scaleX,
        y: particle.y * scaleY,
      }));
      bubbles = bubbles.map((bubble) => ({
        ...bubble,
        x: bubble.x * scaleX,
        y: bubble.y * scaleY,
      }));
    };
    resize(false);

    const spawnParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.05,
        depth: Math.random() * 0.8 + 0.2,
        life: Math.random(),
        pulse: Math.random() * 0.025 + 0.005,
      }));
    };
    const spawnBubble = (forceTop = false) => ({
      x: Math.random() * canvasWidth,
      y: forceTop ? canvasHeight + Math.random() * 60 : Math.random() * canvasHeight,
      r: Math.random() * 6 + 2,
      vy: -(Math.random() * 0.4 + 0.2),
      sway: Math.random() * Math.PI * 2,
      swayAmp: Math.random() * 0.6 + 0.2,
      depth: Math.random() * 0.8 + 0.2,
    });
    const spawnBubbles = () => {
      bubbles = Array.from({ length: BUBBLE_COUNT }, () => spawnBubble(false));
    };
    spawnParticles();
    spawnBubbles();

    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => resize(true));
    };
    const onMouse = (e) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5) * 30;
      mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5) * 30;
    };
    window.addEventListener('resize', onResize, { passive: true });
    if (!compactViewport && !reduceMotion) {
      window.addEventListener('mousemove', onMouse, { passive: true });
    }

    const step = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // ease parallax
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.04;

      // gradient overlay - use theme colors
      const grad = ctx.createRadialGradient(
        canvasWidth / 2, canvasHeight * 0.4, 0,
        canvasWidth / 2, canvasHeight * 0.4, Math.max(canvasWidth, canvasHeight) * 0.7
      );
      // parse tint to get base color for gradient
      const tintMatch = tint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const r = tintMatch ? tintMatch[1] : '30';
      const g = tintMatch ? tintMatch[2] : '41';
      const b = tintMatch ? tintMatch[3] : '59';
      if (mode === 'light') {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.26, 'rgba(255, 246, 228, 0.12)');
        grad.addColorStop(0.58, `rgba(${r}, ${g}, ${b}, 0.1)`);
        grad.addColorStop(1, `rgba(${Math.min(255, Math.floor(Number(r) + 26))}, ${Math.min(255, Math.floor(Number(g) + 18))}, ${Math.max(104, Math.floor(Number(b) * 0.45))}, 0.16)`);
      } else {
        grad.addColorStop(0, 'rgba(30, 41, 59, 0.0)');
        grad.addColorStop(1, `rgba(${Math.floor(Number(r)*0.1)}, ${Math.floor(Number(g)*0.1)}, ${Math.floor(Number(b)*0.1)}, 0.4)`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += p.pulse;
        if (p.x < 0) p.x = canvasWidth;
        if (p.x > canvasWidth) p.x = 0;
        if (p.y < 0) p.y = canvasHeight;
        if (p.y > canvasHeight) p.y = 0;
        const alpha = 0.20 + Math.abs(Math.sin(p.life)) * 0.55;
        const offX = mouseRef.current.x * p.depth;
        const offY = mouseRef.current.y * p.depth;
        ctx.beginPath();
        ctx.arc(p.x + offX, p.y + offY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = tint.replace(/[\d.]+\)$/, `${alpha.toFixed(2)})`);
        ctx.shadowColor = tint;
        ctx.shadowBlur = 9;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // bubbles
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y += b.vy;
        b.sway += 0.02;
        const swayX = Math.sin(b.sway) * b.swayAmp;
        const offX = mouseRef.current.x * b.depth * 0.6;
        const offY = mouseRef.current.y * b.depth * 0.6;
        if (b.y < -20) {
          bubbles[i] = spawnBubble(true);
          continue;
        }
        ctx.beginPath();
        ctx.arc(b.x + swayX + offX, b.y + offY, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = mode === 'light'
          ? `rgba(${Math.min(255, Number(r) + 48)}, ${Math.min(255, Number(g) + 34)}, 198, ${0.12 * b.depth})`
          : `rgba(186, 230, 253, ${0.28 * b.depth})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // highlight
        ctx.beginPath();
        ctx.arc(b.x + swayX + offX - b.r * 0.35, b.y + offY - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = mode === 'light'
          ? `rgba(255, 255, 255, ${0.7 * b.depth})`
          : `rgba(255, 255, 255, ${0.45 * b.depth})`;
        ctx.fill();
      }

      if (!reduceMotion) {
        animRef.current = requestAnimationFrame(step);
      }
    };
    step();

    return () => {
      cancelAnimationFrame(animRef.current);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [intensity, tint, mode]);

  const isLight = mode === 'light';
  const shellGridOpacity = isLight ? 'opacity-80' : 'opacity-50';
  const primary = colors?.primary || '#6366f1';
  const secondary = colors?.secondary || '#06b6d4';
  const accent = colors?.accent || '#22d3ee';
  const backgroundShell = isLight
    ? `radial-gradient(circle at top, rgba(255,255,255,0.98) 0%, ${rgba(colors?.surface || '#fff8ee', 0.94)} 34%, ${rgba(colors?.surfaceAlt || '#f4e2bb', 0.78)} 74%, ${rgba(colors?.border || '#dec7a0', 0.52)} 100%)`
    : `radial-gradient(ellipse at top, ${rgba(colors?.surfaceAlt || '#1e293b', 0.62)} 0%, ${rgba(colors?.surface || '#0f172a', 0.46)} 30%, ${colors?.background || '#020617'} 100%)`;
  const overlayWash = isLight
    ? `linear-gradient(145deg, rgba(255,255,255,0.76) 0%, ${rgba(primary, 0.08)} 22%, ${rgba(secondary, 0.08)} 58%, ${rgba(accent, 0.08)} 100%)`
    : `linear-gradient(180deg, ${rgba(primary, 0.16)} 0%, transparent 38%, ${rgba(secondary, 0.14)} 100%)`;
  const vignette = isLight
    ? `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 58%, ${rgba(accent, 0.12)} 100%)`
    : `linear-gradient(180deg, transparent 0%, transparent 56%, ${rgba(colors?.background || '#020617', 0.82)} 100%)`;
  const radialLightA = `radial-gradient(circle_at_16%_18%, ${rgba(primary, isLight ? 0.18 : 0.14)}, transparent 26%)`;
  const radialLightB = `radial-gradient(circle_at_82%_20%, ${rgba(secondary, isLight ? 0.18 : 0.12)}, transparent 28%)`;
  const radialLightC = `radial-gradient(circle_at_50%_78%, ${rgba(accent, isLight ? 0.14 : 0.1)}, transparent 34%)`;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: backgroundShell }} />
      <div className="absolute inset-0" style={{ background: overlayWash }} />
      <div className="absolute inset-0" style={{ backgroundImage: `${radialLightA}, ${radialLightB}, ${radialLightC}` }} />
      <div className={`absolute inset-0 grid-pattern ${shellGridOpacity}`} />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute -top-24 -left-24 w-[540px] h-[540px] rounded-full blur-[130px] animate-pulse-slow" style={{ backgroundColor: isLight ? rgba(primary, 0.18) : rgba(primary, 0.2) }} />
      <div className="absolute -bottom-24 -right-24 w-[560px] h-[560px] rounded-full blur-[130px] animate-pulse-slower" style={{ backgroundColor: isLight ? rgba(secondary, 0.16) : rgba(secondary, 0.18) }} />
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-[150px] animate-pulse-slow" style={{ backgroundColor: isLight ? rgba(accent, 0.13) : rgba(accent, 0.12) }} />
      {isLight && <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.48), transparent 42%)' }} />}
      <div className="absolute inset-0" style={{ background: vignette }} />
    </div>
  );
};
