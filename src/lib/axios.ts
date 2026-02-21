import axios from 'axios';

// Use relative path in dev to trigger Vite proxy, or env var in prod
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically add Token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to sanitize blob URLs locally so they don't break frontend mapping
const sanitizeBlobUrls = (data: any) => {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) {
    data.forEach(sanitizeBlobUrls);
  } else {
    for (const key in data) {
      if (typeof data[key] === 'string' && data[key].startsWith('blob:')) {
        data[key] = ''; // Change to empty string so fallback UI triggers
      } else if (typeof data[key] === 'object') {
        sanitizeBlobUrls(data[key]);
      }
    }
  }
};

// Interceptor: Handle 401 (Unauthorized) errors globally and sanitize blob references
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      sanitizeBlobUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
