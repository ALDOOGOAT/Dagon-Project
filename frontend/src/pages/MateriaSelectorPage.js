import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Zap, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { DagonMascot } from '../components/DagonMascot';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cachedGet } from '../services/apiClient';
import { MATERIAS, getMateria } from '../config/materias';
import { sounds } from '../lib/SoundEngine';

// Si /api/materias no responde se ofrecen las dos materias conocidas, sin progreso.
const MATERIAS_RESPALDO = Object.values(MATERIAS).map((m, i) => ({
  slug: m.slug,
  nombre: m.nombre,
  descripcion: '',
  orden: i + 1,
  xp: 0,
  modulosTotal: 0,
  modulosCompletados: 0,
}));

const DESCRIPCION_RESPALDO = {
  sql: 'Consultas, JOINs, modelado y transacciones con PostgreSQL, validadas contra una base real.',
  io: 'Programación lineal, redes, inventarios, colas y Markov, con calculadora paso a paso.',
};

// Cada materia conserva su acento: SQL el de la paleta del usuario, IO el ámbar de operaciones.
const ACENTOS = {
  sql: { a: '#10b981', b: '#06b6d4' },
  io: { a: '#f59e0b', b: '#8b5cf6' },
};

export const MateriaSelectorPage = () => {
  const navigate = useNavigate();
  const reducir = useReducedMotion();
  const { user, logout } = useAuth();
  const { colors, setMateria } = useTheme();
  const [materias, setMaterias] = useState(null);

  useEffect(() => {
    let activo = true;
    cachedGet('/api/materias', {}, { ttl: 10_000 })
      .then((res) => {
        if (!activo) return;
        const lista = Array.isArray(res.data) ? res.data : [];
        setMaterias(lista.length ? [...lista].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)) : MATERIAS_RESPALDO);
      })
      .catch(() => {
        if (!activo) return;
        toast.error('No se pudo cargar el progreso por materia');
        setMaterias(MATERIAS_RESPALDO);
      });
    return () => { activo = false; };
  }, []);

  const elegir = (slug) => {
    sounds.playClick?.();
    setMateria(slug);
    navigate('/dashboard');
  };

  const salir = () => {
    logout();
    navigate('/');
  };

  const lista = materias || [];

  return (
    <div className="min-h-screen" data-testid="materia-selector-page">
      <div className="dagon-page-shell dagon-page-shell--wide">
        <motion.header
          initial={reducir ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center gap-3 text-center lg:mb-12"
        >
          <DagonMascot size="large" mood="excited" />
          <p className="arcane-kicker text-xs font-bold" style={{ color: colors.accent }}>
            Hola, {user?.nombre || 'aventurero'}
          </p>
          <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl xl:text-5xl" style={{ color: colors.text }}>
            Elige tu materia
          </h1>
          <p className="max-w-xl font-gameui text-sm leading-relaxed sm:text-base" style={{ color: colors.textMuted }}>
            Tu XP es una sola; cada materia tiene su propio mapa, su ranking y su certificado. Puedes cambiar cuando quieras.
          </p>
        </motion.header>

        {!materias && (
          <div className="flex justify-center py-10" role="status" aria-label="Cargando materias">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
              style={{ borderTopColor: colors.primary, borderRightColor: colors.secondary }}
            />
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 lg:gap-7">
          {lista.map((m, i) => {
            const cfg = getMateria(m.slug);
            const Icono = cfg.icono;
            const acento = ACENTOS[m.slug] || ACENTOS.sql;
            const total = Number(m.modulosTotal) || 0;
            const hechos = Number(m.modulosCompletados) || 0;
            const pct = total ? Math.min(100, Math.round((hechos / total) * 100)) : 0;
            return (
              <motion.button
                key={m.slug}
                type="button"
                onClick={() => elegir(m.slug)}
                data-testid={`materia-${m.slug}`}
                initial={reducir ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                whileHover={reducir ? undefined : { y: -4 }}
                className="glass-card-apple group relative flex min-h-[18rem] flex-col gap-5 overflow-hidden rounded-3xl border p-6 text-left sm:p-7"
                style={{ borderColor: `${acento.a}55` }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${acento.a}1f, transparent 55%, ${acento.b}1a)` }}
                />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform group-hover:scale-105"
                    style={{ borderColor: `${acento.a}66`, background: `linear-gradient(135deg, ${acento.a}33, ${acento.b}22)` }}
                  >
                    <Icono className="h-7 w-7" style={{ color: acento.a }} />
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black"
                    style={{ borderColor: `${acento.a}55`, color: acento.a }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {Number(m.xp) || 0} XP
                  </span>
                </div>

                <div className="relative z-10 min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-black sm:text-3xl" style={{ color: colors.text }}>
                    {m.nombre || cfg.nombre}
                  </h2>
                  <p className="mt-2 font-gameui text-sm leading-relaxed sm:text-base" style={{ color: colors.textMuted }}>
                    {m.descripcion || DESCRIPCION_RESPALDO[m.slug] || ''}
                  </p>
                </div>

                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold" style={{ color: colors.textMuted }}>
                    <span>{total ? `${hechos} de ${total} módulos` : 'Sin módulos aún'}</span>
                    <span style={{ color: acento.a }}>{pct}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: `${colors.border}99` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso en ${m.nombre || cfg.nombre}`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${acento.a}, ${acento.b})` }}
                      initial={reducir ? false : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.35 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div
                    className="mt-5 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display font-black text-white transition-transform group-hover:translate-x-1"
                    style={{ background: `linear-gradient(135deg, ${acento.a}, ${acento.b})` }}
                  >
                    {hechos > 0 ? 'Continuar' : 'Empezar'}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={salir}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 font-gameui text-sm font-bold opacity-80 transition-opacity hover:opacity-100"
            style={{ color: colors.textMuted }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default MateriaSelectorPage;
