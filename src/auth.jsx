/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import axios from 'axios';
import { AUTH_ENDPOINTS } from './constants/api.js';

// Helper to decode a JWT and extract its payload. Returns null on failure.
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const refresh = localStorage.getItem('refresh');
    if (!token) return null;
    const tokenPayload = parseJwt(token) || {};
    const refreshPayload = parseJwt(refresh || '') || {};
    return {
      token,
      refresh,
      tokenExp: tokenPayload.exp,
      refreshExp: refreshPayload.exp,
    };
  });

  const logoutTimerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('loginTime');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      return;
    }
    if (!localStorage.getItem('loginTime')) {
      localStorage.setItem('loginTime', String(Date.now()));
    }
    const loginTime = Number(localStorage.getItem('loginTime'));
    const remaining = ONE_DAY_MS - (Date.now() - loginTime);
    if (remaining <= 0) {
      logout();
    } else {
      logoutTimerRef.current = setTimeout(logout, remaining);
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [user, logout]);

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
    localStorage.setItem('loginTime', String(Date.now()));
    const accessPayload = parseJwt(access) || {};
    const refreshPayload = parseJwt(refresh) || {};
    setUser({
      token: access,
      refresh,
      tokenExp: accessPayload.exp,
      refreshExp: refreshPayload.exp,
    });
  };

  const refreshToken = async () => {
    const storedRefresh = localStorage.getItem('refresh');
    if (!storedRefresh) {
      throw new Error('No refresh token');
    }
    const refreshPayload = parseJwt(storedRefresh) || {};
    if (refreshPayload.exp && refreshPayload.exp * 1000 < Date.now()) {
      logout();
      throw new Error('Refresh token expired');
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
    const accessPayload = parseJwt(access) || {};
    localStorage.setItem('token', access);
    setUser({
      token: access,
      refresh: storedRefresh,
      tokenExp: accessPayload.exp,
      refreshExp: refreshPayload.exp,
    });
    return access;
  };

  const getValidToken = async () => {
    if (!user) {
      throw new Error('Not authenticated');
    }
    const loginTime = Number(localStorage.getItem('loginTime'));
    if (loginTime && Date.now() - loginTime > ONE_DAY_MS) {
      logout();
      throw new Error('Session expired');
    }
    if (user.tokenExp && user.tokenExp * 1000 < Date.now()) {
      return refreshToken();
    }
    return user.token;
  };

  // Axios instance with interceptors to handle auth and refresh flow
  const authFetch = axios.create();

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  authFetch.interceptors.request.use(async (config) => {
    const token = await getValidToken();
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return config;
  });

  authFetch.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest._retry = true;
              return authFetch(originalRequest);
            })
            .catch(Promise.reject);
        }

        originalRequest._retry = true;
        isRefreshing = true;
        try {
          const newToken = await refreshToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return authFetch(originalRequest);
        } catch (err) {
          processQueue(err, null);
          logout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refreshToken, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
