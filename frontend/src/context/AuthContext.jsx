import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Lecture synchrone du sessionStorage (instantanée, pas besoin de useEffect)
function getStoredAdmin() {
  try {
    const token = sessionStorage.getItem('cci_token');
    const user  = sessionStorage.getItem('cci_user');
    if (token && user) {
      return { token, ...JSON.parse(user) };
    }
  } catch { sessionStorage.clear(); }
  return null;
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(getStoredAdmin);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
    sessionStorage.setItem('cci_token', data.token);
    sessionStorage.setItem('cci_user', JSON.stringify(data.user));
    setAdmin({ token: data.token, ...data.user });
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('cci_token');
    sessionStorage.removeItem('cci_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuth: !!admin, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);