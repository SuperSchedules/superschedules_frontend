/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('token');
    return stored ? { token: stored } : null;
  });

  const login = async (username, password) => {
    // Simulate API login returning token
    const token = btoa(`${username}:${password}`);
    localStorage.setItem('token', token);
    setUser({ token });
  };

  const logout = () => {
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
