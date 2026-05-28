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
  const [codigoClase, setCodigoClase] = useState('');
  const [claveDocente, setClaveDocente] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const { login, register, loginGoogle } = useAuth();
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
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        const extraData = {};
        if (rol === 'alumno' && codigoClase) extraData.codigoClase = codigoClase;
        if (rol === 'docente') extraData.claveDocente = claveDocente;
        
        result = await register(name, email, password, rol, extraData);
      }

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

  const handleGoogleLogin = async () => {
    toast.info('Iniciando sesión con Google...');
    // Simulamos la respuesta de Google para esta implementación
    // En una implementación real, aquí se usaría el token obtenido del SDK de Google
    const mockGoogleUser = {
      email: email || 'aventurero@gmail.com',
      name: name || 'Aventurero Google'
    };
    
    setLoading(true);
    const result = await loginGoogle(mockGoogleUser);
    setLoading(false);
    
    if (result.success) {
      toast.success('¡Autenticado con Google!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
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
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'free', label: 'Libre', icon: <Sparkles className="w-4 h-4" /> },
                          { value: 'alumno', label: 'Alumno', icon: <User className="w-4 h-4" /> },
                          { value: 'docente', label: 'Docente', icon: <BookOpen className="w-4 h-4" /> },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRol(opt.value)}
                            className="flex items-center justify-center gap-2 h-11 rounded-xl border text-[10px] sm:text-xs font-bold transition-all"
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

                    <AnimatePresence>
                      {rol === 'alumno' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-1"
                        >
                          <Label htmlFor="codigoClase" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                            <Zap className="w-3 h-3" style={{ color: colors.primary }} /> Código de Clase (Opcional)
                          </Label>
                          <Input
                            id="codigoClase"
                            placeholder="Ej: CLASE-2026"
                            value={codigoClase}
                            onChange={(e) => setCodigoClase(e.target.value)}
                            className="login-input h-10 rounded-xl text-sm"
                            style={{ backgroundColor: `${colors.surface}b3`, borderColor: colors.border }}
                          />
                        </motion.div>
                      )}
                      {rol === 'docente' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-1"
                        >
                          <Label htmlFor="claveDocente" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: labelColor }}>
                            <Lock className="w-3 h-3" style={{ color: colors.accent }} /> Clave Maestra Docente
                          </Label>
                          <Input
                            id="claveDocente"
                            type="password"
                            placeholder="Clave otorgada por Admin"
                            value={claveDocente}
                            onChange={(e) => setClaveDocente(e.target.value)}
                            className="login-input h-10 rounded-xl text-sm"
                            style={{ backgroundColor: `${colors.surface}b3`, borderColor: colors.accent }}
                            required
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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

            <div className="relative flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-border" style={{ backgroundColor: colors.border }}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor }}>O entra con</span>
              <div className="flex-1 h-px bg-border" style={{ backgroundColor: colors.border }}></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 rounded-xl flex items-center justify-center gap-3 font-bold border-2 transition-all hover:bg-muted"
              style={{ borderColor: colors.border, backgroundColor: 'transparent', color: colors.text }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

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
