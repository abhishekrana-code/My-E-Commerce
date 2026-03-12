import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Only add header if token exists and is not the string "undefined"
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 422)) {
      // If unauthorized, clear storage and redirect to login
      const msg = error.response.data?.message || error.response.data?.msg || 'Session expired or invalid. Please login again.';
      alert(msg);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
