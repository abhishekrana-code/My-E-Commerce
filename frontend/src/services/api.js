import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Clean token: remove all quotes and trim whitespace
    const cleanToken = token.replace(/["]/g, '').trim();
    
    // Only add header if token is not a "null"/"undefined" string and not empty
    if (cleanToken && cleanToken !== 'null' && cleanToken !== 'undefined') {
      config.headers['Authorization'] = `Bearer ${cleanToken}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 422 || error.response.status === 403)) {
      // If unauthorized or forbidden (banned), clear storage and redirect to login
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
