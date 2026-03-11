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

          // ¡NUEVO! Le mostramos el pasaporte a Java en la petición GET
          const response = await axios.get(`http://localhost:8080/api/usuarios/${userId}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser(response.data); 
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Dejamos el pasaporte listo para el resto de peticiones
          
        } catch (error) {
          console.error("Error al validar el token real", error);
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
      const response = await axios.post(`http://localhost:8080/api/usuarios/login`, { 
        email: email, 
        passwordHash: password 
      });
      
      // ¡Ahora Java nos manda el token real y el user!
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Error de conexión con el servidor' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/usuarios/registro`, { 
        nombre: name, 
        email: email, 
        passwordHash: password 
      });
      
      // ¡Ahora Java nos manda el token real y el user!
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
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