import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { cachedGet, invalidateApiCache } from '../services/apiClient';

const AuthContext = createContext(null);

const persistUser = (nextUser) => {
  if (nextUser) {
    localStorage.setItem('dagon_user_cache', JSON.stringify(nextUser));
  }
};

const mergeUserProfile = (profile, previous) => {
  if (!profile) return previous || null;
  const merged = { ...(previous || {}), ...profile };

  // El perfil publico no incluye metricas calculadas; no borres XP/racha frescas del dashboard.
  if (profile.xp == null && previous?.xp != null) {
    merged.xp = previous.xp;
  }
  if (profile.racha == null && previous?.racha != null) {
    merged.racha = previous.racha;
  }

  return merged;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Escuchar evento global de desautorización desde el apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('dagon_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dagon_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      // Si hay un token y NO es el falso de antes
      if (token && !token.startsWith('token-dagon-')) {
        try {
          // Un pequeño truco de React para "abrir" el JWT y leer el ID que viene adentro
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
// ...código decodificador del token...

          const payload = JSON.parse(jsonPayload);
          const userId = payload.sub; 

          const cachedUserRaw = localStorage.getItem('dagon_user_cache');
          if (cachedUserRaw) {
            const cachedUser = JSON.parse(cachedUserRaw);
            if (String(cachedUser?.idUsuario) === String(userId)) {
              setUser(cachedUser);
              setLoading(false);
            }
          }

          const response = await cachedGet(`/api/usuarios/${userId}/profile`, {}, { ttl: 30_000 });

          setUser(prev => {
            const merged = mergeUserProfile(response.data, prev);
            persistUser(merged);
            return merged;
          });
          
        } catch {
          logout();
        }
      } else if (token) {
        logout(); // Si el token es de los viejos "falsos", cerramos sesión para limpiar
      }
      setLoading(false);
    };
    
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/usuarios/login', {
        email: email,
        passwordHash: password
      });
      
      // ¡Ahora Java nos manda el token real y el user!
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      persistUser(newUser);
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error de conexión con el servidor' };
    }
  };

  const register = async (name, email, password, rol = 'alumno', options = {}) => {
    try {
      const response = await apiClient.post('/api/usuarios/registro', {
        nombre: name,
        email: email,
        passwordHash: password,
        rol: rol,
        codigoGrupo: options.codigoGrupo || undefined,
        codigoDocente: options.codigoDocente || undefined
      });

      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      persistUser(newUser);
      localStorage.setItem('dagon_first_login', 'true');
      localStorage.setItem('dagon_tutorial_pending', 'true');
      if (rol === 'docente') {
        localStorage.setItem('dagon_docente_tutorial_pending', 'true');
      }
      localStorage.removeItem('dagon_tutorial_completed');
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error al registrarse en el servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('dagon_user_cache');
    localStorage.removeItem('userAvatar');
    invalidateApiCache();
    setToken(null);
    setUser(null);
  };

  const updateUserXP = useCallback((newXPOrUpdater) => {
    setUser(prev => {
      const newXP = typeof newXPOrUpdater === 'function'
        ? newXPOrUpdater(prev?.xp || 0, prev)
        : newXPOrUpdater;
      if (!prev || prev.xp === newXP) return prev;
      const updated = { ...prev, xp: newXP };
      persistUser(updated);
      return updated;
    });
  }, []);

  const updateUserStreak = useCallback((newStreak) => {
    setUser(prev => {
      if (!prev || prev.racha === newStreak) return prev;
      const updated = { ...prev, racha: newStreak };
      persistUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserXP, updateUserStreak }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
