import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const tokenString = localStorage.getItem('token');
      if (tokenString) {
        const tokenObj = JSON.parse(tokenString);
        if (tokenObj.access) {
          config.headers.Authorization = `Bearer ${tokenObj.access}`;
          console.log('Setting Authorization header:', config.headers.Authorization);
        }
      }
    } catch (error) {
      console.error('Error processing token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
