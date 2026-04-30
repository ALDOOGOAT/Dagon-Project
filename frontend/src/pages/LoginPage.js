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
import { Sparkles, Zap, Trophy, Flame, Database, Mail, Lock, User } from 'lucide-react';
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
      const result = isLogin ? await login(email, password) : await register(name, email, password);
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
    <div className={`min-h-screen flex relative overflow-hidden transition-opacity duration-500 ${isPageReady ? 'opacity-100' : 'opacity-0'}`} data-testid="login-page">
      {/* Lado izquierdo: cinemático */}
<div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden" style={{ backgroundColor: colors.background }}>
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${colors.primary}40, transparent 70%)` }} />

        <div className="relative z-10 text-center space-y-8 px-12">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="relative inline-block">
              <div className="absolute -inset-12 rounded-full blur-3xl animate-pulse-glow" style={{ backgroundColor: `${colors.primary}30` }} />
              <div className="relative animate-float">
                <DagonMascot size="large" mood="excited" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display text-7xl font-black text-gradient-abyss drop-shadow-[0_4px_30px_rgba(99,102,241,0.35)] tracking-tight"
          >
            DAGON
          </motion.h1>

          <div className="h-14 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIdx}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xl font-gameui font-medium max-w-md mx-auto"
                style={{ color: mutedColor }}
              >
                {TAGLINES[taglineIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            {HIGHLIGHTS.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-apple text-sm font-bold hover:scale-105 transition-all"
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
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-xs font-gameui font-bold uppercase tracking-[0.4em] pt-4"
            style={{ color: mutedColor }}
          >
            <Sparkles className="w-3 h-3" style={{ color: colors.primary }} />
            <span>Tutor IA Clawbot incluido</span>
            <Sparkles className="w-3 h-3" style={{ color: colors.primary }} />
          </motion.div>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:hidden mb-4">
            <div className="inline-block animate-float">
              <DagonMascot size="medium" mood="happy" />
            </div>
            <h1 className="font-display text-5xl font-black text-gradient-abyss mt-3">DAGON</h1>
          </div>

          <div
            className="glass-card-apple rounded-3xl p-8 space-y-6 border holo-border"
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
              <h2 className="font-display text-3xl font-black mb-2" style={{ color: headingColor }}>
                {isLogin ? 'Vuelve al abismo' : 'Forja tu leyenda'}
              </h2>
              <p className="font-gameui text-sm" style={{ color: mutedColor }}>
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
                      className="h-12 rounded-xl"
                      style={{
                        backgroundColor: `${colors.surface}b3`,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                      required
                    />
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
                  className="h-12 rounded-xl"
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
                  className="h-12 rounded-xl"
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
                className="w-full font-display font-black text-lg tracking-wide py-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
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
      </div>
    </div>
  );
};
