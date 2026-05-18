import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Trophy, Flame, Database, Mail, Lock, User, BookOpen, GraduationCap } from 'lucide-react';
import { sounds } from '../lib/SoundEngine';

const TAGLINES = [
  'Domina SQL como un explorador del abismo',
  'Sube de nivel resolviendo misiones de datos',
  'Tu IA tutora Clawbot te guía paso a paso',
  '5 niveles, infinitos JOINs, una sola leyenda',
];

const HIGHLIGHTS = [
  { icon: <Zap className="w-4 h-4" />, label: 'Gana XP' },
  { icon: <Flame className="w-4 h-4" />, label: 'Forja tu racha' },
  { icon: <Trophy className="w-4 h-4" />, label: 'Conquista el ranking' },
];

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('alumno');
  const [loading, setLoading] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const { login, register } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const labelColor = isLight ? '#6b4f1d' : '#e2e8f0';
  const chipTextColor = isLight ? '#5b4636' : '#e2e8f0';
  const chipStyle = {
    color: chipTextColor,
    borderColor: isLight ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.10)',
    backgroundColor: isLight ? 'rgba(255, 250, 240, 0.72)' : 'rgba(255,255,255,0.05)',
  };
  const accentBadgeStyle = {
    color: colors.primary,
    backgroundColor: isLight ? 'rgba(250, 204, 21, 0.12)' : 'rgba(6, 182, 212, 0.10)',
    borderColor: isLight ? 'rgba(245, 158, 11, 0.24)' : `${colors.primary}4d`,
  };
  const loginShellStyle = {
    '--login-primary': colors.primary,
    '--login-secondary': colors.secondary,
    '--login-accent': colors.accent,
    '--login-bg': colors.background,
    '--login-surface': colors.surface,
    '--login-border': colors.border,
    '--login-text': colors.text,
    '--login-muted': colors.textMuted,
  };

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setIsPageReady(true)));
    sounds.init();
    const id = setInterval(() => setTaglineIdx((i) => (i + 1) % TAGLINES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isLogin ? await login(email, password) : await register(name, email, password, rol);
      if (result.success) {
        sounds.playSuccess();
        toast.success('¡Bienvenido a las profundidades del conocimiento!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`login-shell min-h-screen flex flex-col lg:flex-row relative overflow-hidden transition-opacity duration-500 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}
      style={loginShellStyle}
      data-testid="login-page"
    >
      <div className="login-mobile-atmosphere lg:hidden" />

      <section className="login-cinematic-panel hidden lg:flex lg:w-[56%] items-center justify-center relative overflow-hidden">
        <div className="login-rune-grid" />
        <div className="login-orbit login-orbit-one" />
        <div className="login-orbit login-orbit-two" />

        <div className="relative z-10 w-full max-w-3xl px-12 text-center">
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative mx-auto mb-8 flex h-72 items-center justify-center"
          >
            <div className="login-dagon-aura" />
            <div className="login-dagon-ring" />
            <DagonMascot size="large" mood="excited" />
          </motion.div>

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.65 }}
            className="space-y-5"
          >
            <p className="arcane-kicker text-xs font-black" style={{ color: colors.accent }}>
              Academia SQL inmersiva
            </p>
            <h1 className="text-arcane-title font-display text-7xl xl:text-8xl font-black leading-none text-gradient-abyss drop-shadow-[0_4px_30px_rgba(99,102,241,0.35)]">
              DAGON
            </h1>
            <div className="mx-auto h-16 max-w-lg">
              <AnimatePresence mode="wait">
                <motion.p
                  key={taglineIdx}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-arcane-body text-xl font-gameui font-semibold"
                  style={{ color: mutedColor }}
                >
                  {TAGLINES[taglineIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-8 grid grid-cols-3 gap-3"
          >
            {HIGHLIGHTS.map((h, i) => (
              <span
                key={i}
                className="login-feature-chip inline-flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold"
                style={chipStyle}
              >
                <span style={{ color: colors.primary }}>{h.icon}</span>
                {h.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="arcane-kicker mt-8 flex items-center justify-center gap-3 text-xs font-black"
            style={{ color: mutedColor }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: colors.primary }} />
            <span>Tutor IA Clawbot incluido</span>
            <Sparkles className="w-3.5 h-3.5" style={{ color: colors.primary }} />
          </motion.div>
        </div>
      </section>

      <section className="login-auth-side flex min-h-screen flex-1 items-start justify-center px-4 py-6 sm:px-6 sm:py-10 lg:w-[44%] lg:items-center lg:px-12 lg:py-12">
        <motion.div
          initial={{ x: 26, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-lg space-y-5 sm:space-y-7"
        >
          <div className="text-center lg:hidden">
            <div className="relative mx-auto inline-flex h-36 w-36 items-center justify-center">
              <div className="login-dagon-aura" />
              <DagonMascot size="medium" mood="happy" />
            </div>
            <p className="arcane-kicker mt-2 text-[10px] font-black" style={{ color: colors.accent }}>
              Academia SQL inmersiva
            </p>
            <h1 className="text-arcane-title font-display text-5xl font-black text-gradient-abyss mt-2">DAGON</h1>
          </div>

          <div
            className="login-auth-card glass-card-apple rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 border holo-border"
            style={{
              borderColor: colors.border,
              boxShadow: isLight ? '0 30px 80px -20px rgba(245, 158, 11, 0.22)' : '0 30px 80px -20px rgba(0,0,0,0.6)'
            }}
          >
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.35em] uppercase px-3 py-1 rounded-full mb-4 border" style={accentBadgeStyle}>
                <Database className="w-3 h-3" />
                {isLogin ? 'Acceso de aventurero' : 'Nuevo aventurero'}
              </span>
              <h2 className="text-arcane-title font-display text-2xl sm:text-3xl font-black mb-2" style={{ color: headingColor }}>
                {isLogin ? 'Vuelve al abismo' : 'Forja tu leyenda'}
              </h2>
              <p className="text-arcane-body font-gameui text-sm" style={{ color: mutedColor }}>
                {isLogin ? 'Continúa tu viaje de aprendizaje SQL' : 'Crea tu cuenta y empieza a ganar XP'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                      <User className="w-3 h-3" style={{ color: colors.primary }} /> Nombre de aventurero
                    </Label>
                    <Input
                      id="name"
                      data-testid="name-input"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="login-input h-12 rounded-xl"
                      style={{
                        backgroundColor: `${colors.surface}b3`,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                      required
                    />
                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                        <GraduationCap className="w-3 h-3" style={{ color: colors.primary }} /> Tipo de cuenta
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'alumno', label: 'Alumno', icon: <User className="w-4 h-4" /> },
                          { value: 'docente', label: 'Docente', icon: <BookOpen className="w-4 h-4" /> },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRol(opt.value)}
                            className="flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-bold transition-all"
                            style={{
                              borderColor: rol === opt.value ? colors.primary : colors.border,
                              backgroundColor: rol === opt.value
                                ? `${colors.primary}20`
                                : `${colors.surface}b3`,
                              color: rol === opt.value ? colors.primary : mutedColor,
                              boxShadow: rol === opt.value ? `0 0 12px ${colors.primary}30` : 'none',
                            }}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                  <Mail className="w-3 h-3" style={{ color: colors.primary }} /> Email
                </Label>
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input h-12 rounded-xl"
                      style={{
                        backgroundColor: `${colors.surface}b3`,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                  <Lock className="w-3 h-3" style={{ color: colors.primary }} /> Contraseña
                </Label>
                <Input
                  id="password"
                  data-testid="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input h-12 rounded-xl"
                      style={{
                        backgroundColor: `${colors.surface}b3`,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                  required
                />
              </div>

              <Button
                type="submit"
                data-testid="submit-button"
                disabled={loading}
                className="w-full font-display font-black text-base sm:text-lg tracking-wide py-5 sm:py-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                  boxShadow: `0 10px 40px ${colors.primary}60`,
                  color: isLight ? '#1f2937' : '#ffffff'
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </span>
                ) : (
                  isLogin ? 'Sumergirse' : 'Comenzar aventura'
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                data-testid="toggle-auth-mode"
                onClick={() => setIsLogin(!isLogin)}
                className="transition-colors text-sm font-gameui"
                style={{ color: mutedColor }}
              >
                {isLogin ? '¿No tienes cuenta? ' : '¿Ya eres aventurero? '}
                <span className="font-bold underline-offset-4 hover:underline">
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
