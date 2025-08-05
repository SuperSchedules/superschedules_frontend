const DEV_API_BASE_URL = 'http://localhost:8000';
const PROD_API_BASE_URL = 'https://api.example.com';

export const API_BASE_URL = import.meta.env.PROD
  ? PROD_API_BASE_URL
  : DEV_API_BASE_URL;

export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/api/token/`,
  refresh: `${API_BASE_URL}/api/token/refresh/`,
  register: `${API_BASE_URL}/api/users/`,
};
