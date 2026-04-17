import { useEffect, useRef } from 'react';

/**
 * Fondo inmersivo "Abyss": canvas con dos capas — partículas tipo plancton
 * y burbujas que ascienden desde el fondo. Reacciona al cursor con un
 * parallax sutil. Pensado para vivir fixed detrás de todo el contenido.
 *
 * Uso: <AbyssBackground intensity={1.2} tint="rgba(99,102,241,0.85)" />
 */
export const AbyssBackground = ({ intensity = 1, tint = 'rgba(99, 102, 241, 0.85)' }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let bubbles = [];
    const PARTICLE_COUNT = Math.floor(70 * intensity);
    const BUBBLE_COUNT = Math.floor(18 * intensity);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const spawnParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.05,
        depth: Math.random() * 0.8 + 0.2,
        life: Math.random(),
        pulse: Math.random() * 0.025 + 0.005,
      }));
    };
    const spawnBubble = (forceTop = false) => ({
      x: Math.random() * canvas.width,
      y: forceTop ? canvas.height + Math.random() * 60 : Math.random() * canvas.height,
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

    const onResize = () => { resize(); spawnParticles(); spawnBubbles(); };
    const onMouse = (e) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth - 0.5) * 30;
      mouseRef.current.ty = (e.clientY / window.innerHeight - 0.5) * 30;
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ease parallax
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.04;

      // gradient overlay
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height * 0.4, 0,
        canvas.width / 2, canvas.height * 0.4, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.0)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += p.pulse;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
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
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.28 * b.depth})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // highlight
        ctx.beginPath();
        ctx.arc(b.x + swayX + offX - b.r * 0.35, b.y + offY - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * b.depth})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(step);
    };
    step();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [intensity, tint]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-abyss-deep" />
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-blue-600/15 blur-[120px] animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-fuchsia-600/15 blur-[120px] animate-pulse-slower" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-cyan-500/8 blur-[140px] animate-pulse-slow" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/70" />
    </div>
  );
};
