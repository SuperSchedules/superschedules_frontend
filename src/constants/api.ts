const DEV_API_BASE_URL = 'http://localhost:8000';
const PROD_API_BASE_URL = 'https://api.example.com';

export const API_BASE_URL: string = import.meta.env.PROD
  ? PROD_API_BASE_URL
  : DEV_API_BASE_URL;

export const API_VERSION: string = import.meta.env.VITE_API_VERSION || 'v1';

const API_ROOT = `${API_BASE_URL}/api/${API_VERSION}`;

export const AUTH_ENDPOINTS = {
  login: `${API_ROOT}/token/`,
  refresh: `${API_ROOT}/token/refresh/`,
  register: `${API_ROOT}/users/`,
  reset: `${API_ROOT}/reset/`,
  resetConfirm: `${API_ROOT}/reset/confirm/`,
} as const;

export const EVENTS_ENDPOINTS = {
  list: `${API_ROOT}/events/`,
} as const;

export const SOURCES_ENDPOINTS = {
  list: `${API_ROOT}/sources/`,
} as const;
