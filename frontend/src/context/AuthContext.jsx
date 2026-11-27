import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

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
    const { data } = await authAPI.login({ email, password });
    sessionStorage.setItem('cci_token', data.token);
    sessionStorage.setItem('cci_user', JSON.stringify(data.user));
    setAdmin({ token: data.token, ...data.user });
    return data;
  };

  const adminLogin = async (email, password) => {
    // scope:"admin" envoyé automatiquement via authAPI.adminLogin
    const { data } = await authAPI.adminLogin({ email, password });
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

  const updateUser = (userData) => {
    const updatedUser = { ...admin, ...userData };
    sessionStorage.setItem('cci_user', JSON.stringify(updatedUser));
    setAdmin(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ admin, login, adminLogin, logout, updateUser, isAuth: !!admin, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);