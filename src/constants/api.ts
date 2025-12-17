const DEV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// In production, default to hosted API (can be overridden via env)
const PROD_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eventzombie.com';

export const API_BASE_URL = import.meta.env.PROD
  ? PROD_API_BASE_URL
  : DEV_API_BASE_URL;

// Allow easy switching between API versions via environment variable
export const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

const API_ROOT = `${API_BASE_URL}/api/${API_VERSION}`;

export const AUTH_ENDPOINTS = {
  login: `${API_ROOT}/token/`,
  refresh: `${API_ROOT}/token/refresh/`,
  register: `${API_ROOT}/users/`,
  reset: `${API_ROOT}/reset/`,
  resetConfirm: `${API_ROOT}/reset/confirm/`,
  verifyEmail: (token: string) => `${API_ROOT}/users/verify/${token}/`,
  resendVerification: `${API_ROOT}/users/resend-verification/`,
};

export const EVENTS_ENDPOINTS = {
  list: `${API_ROOT}/events/`,
};

export const SOURCES_ENDPOINTS = {
  list: `${API_ROOT}/sources/`,
};

export const CHAT_ENDPOINTS = {
  message: `${API_ROOT}/chat/`,
  suggestions: `${API_ROOT}/chat/suggestions/`,
};

// Streaming now uses /api/v1/chat/stream (same as other endpoints)
export const STREAMING_API_BASE_URL = import.meta.env.VITE_STREAMING_API_BASE_URL
  || (import.meta.env.PROD ? API_BASE_URL : 'http://localhost:8002');
