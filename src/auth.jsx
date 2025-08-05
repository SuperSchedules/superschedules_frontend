/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { AUTH_ENDPOINTS } from './constants/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('token');
    return stored ? { token: stored } : null;
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
    const token = data.token;
    localStorage.setItem('token', token);
    setUser({ token });
  };

  const logout = async () => {
    await fetch(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      headers: user ? { Authorization: `Bearer ${user.token}` } : {},
    });
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
