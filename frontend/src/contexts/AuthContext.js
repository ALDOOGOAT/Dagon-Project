import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${API_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await axios.get(`${API}/user/profile`);
          setUser(response.data);
        } catch (error) {
          console.error('Error loading user:', error);
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

const login = async (email, password) => {
    try {
      // 1. Tocamos la nueva puerta de Login que acabas de crear en Java
      const response = await axios.post(`http://localhost:8080/api/usuarios/login`, { 
        email: email, 
        passwordHash: password // Traducimos "password" a "passwordHash" para tu Java
      });
      
      const userData = response.data; // Tu base de datos nos devuelve tu usuario

      // 2. Usamos el mismo truco del token temporal para que React te deje entrar al Dashboard
      const fakeToken = "token-dagon-" + userData.idUsuario;
      
      localStorage.setItem('token', fakeToken);
      setToken(fakeToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;
      
      return { success: true };
    } catch (error) {
      // Si Java responde que la contraseña está mal o el correo no existe, React muestra el error
      return { success: false, error: error.response?.data || 'Error de conexión con el servidor' };
    }
  };

const register = async (name, email, password) => {
    try {
      // 1. Apuntamos a tu servidor Java y traducimos las variables al español
      const response = await axios.post(`http://localhost:8080/api/usuarios/registro`, { 
        nombre: name, 
        email: email, 
        passwordHash: password 
      });
      
      const userData = response.data; // Java nos devuelve tu usuario recién creado

      // 2. Como aún no programamos la seguridad de Tokens (JWT) en Java, 
      // engañamos a React con un token temporal para que te deje pasar al Dashboard.
      const fakeToken = "token-dagon-" + userData.idUsuario;
      
      localStorage.setItem('token', fakeToken);
      setToken(fakeToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;
      
      return { success: true };
    } catch (error) {
      // Si Java responde con el error 400 (ej. "El correo ya existe"), lo mostramos
      return { success: false, error: error.response?.data || 'Error al registrarse en el servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUserXP = (newXP) => {
    setUser(prev => ({ ...prev, xp: newXP }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserXP }}>
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