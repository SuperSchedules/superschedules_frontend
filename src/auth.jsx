/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { AUTH_ENDPOINTS } from './constants/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const refresh = localStorage.getItem('refresh');
    return token ? { token, refresh } : null;
  });

  const login = async (username, password) => {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Login failed');
    }
    const data = await response.json();
    const { access, refresh } = data;
    localStorage.setItem('token', access);
    localStorage.setItem('refresh', refresh);
    setUser({ token: access, refresh });
  };

  const refreshToken = async () => {
    const storedRefresh = localStorage.getItem('refresh');
    if (!storedRefresh) {
      throw new Error('No refresh token');
    }
    const response = await fetch(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: storedRefresh }),
    });
    if (!response.ok) {
      logout();
      throw new Error('Refresh failed');
    }
    const data = await response.json();
    const access = data.access;
    localStorage.setItem('token', access);
    setUser({ token: access, refresh: storedRefresh });
    return access;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
