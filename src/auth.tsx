/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_ENDPOINTS } from './constants/api';

interface JWTPayload {
  exp?: number;
  [key: string]: any;
}

interface User {
  token: string;
  refresh: string;
  tokenExp?: number;
  refreshExp?: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string>;
  authFetch: AxiosInstance;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string;
}

interface QueueItem {
  resolve: (value: string) => void;
  reject: (error: any) => void;
}

// Helper to decode a JWT and extract its payload. Returns null on failure.
function parseJwt(token: string): JWTPayload | null {
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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
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

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    // Clear auth tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('loginTime');

    // Clear user-specific chats
    if (user) {
      const userId = (user as any).id;
      if (userId) {
        const chatKey = `superschedules_chats_user${userId}`;
        const sessionKey = `superschedules_session_user${userId}`;
        localStorage.removeItem(chatKey);
        localStorage.removeItem(sessionKey);
        console.log('Cleared user-specific chats on logout');
      }
    }

    setUser(null);
  }, [user]);

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

  const login = async (username: string, password: string): Promise<void> => {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Login failed');
    }
    const data: LoginResponse = await response.json();
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

  const refreshToken = async (): Promise<string> => {
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
    const data: RefreshResponse = await response.json();
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

  const getValidToken = async (): Promise<string> => {
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
  let failedQueue: QueueItem[] = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });
    failedQueue = [];
  };

  authFetch.interceptors.request.use(async (config: AxiosRequestConfig) => {
    const token = await getValidToken();
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return config;
  });

  authFetch.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
