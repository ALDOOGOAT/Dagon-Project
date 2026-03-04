import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await register(name, email, password);

      if (result.success) {
        toast.success(`¡Bienvenido a las profundidades del conocimiento!`);
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
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="hidden lg:flex lg:w-1/2 abyss-bg items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1771864808299-d380c14eecdb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxkZWVwJTIwb2NlYW4lMjBiaW9sdW1pbmVzY2VuY2UlMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzI2NjA5MzN8MA&ixlib=rb-4.1.0&q=85"
            alt="Deep Ocean"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <DagonMascot size="large" mood="happy" />
          <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Dagon
          </h1>
          <p className="text-xl text-slate-300 max-w-md mx-auto" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Sumérgete en las profundidades del conocimiento SQL
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <DagonMascot size="medium" mood="happy" />
            <h1 className="text-4xl font-bold text-white mt-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Dagon
            </h1>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
              <p className="text-slate-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {isLogin ? 'Continúa tu viaje de aprendizaje' : 'Comienza tu aventura SQL'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Nombre</Label>
                  <Input
                    id="name"
                    data-testid="name-input"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950 border-slate-800 focus:border-red-500 text-slate-200"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-red-500 text-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
                <Input
                  id="password"
                  data-testid="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 focus:border-red-500 text-slate-200"
                  required
                />
              </div>

              <Button
                type="submit"
                data-testid="submit-button"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              >
                {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                data-testid="toggle-auth-mode"
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};