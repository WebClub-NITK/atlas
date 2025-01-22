import axios from 'axios';

export const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
      const { access } = JSON.parse(tokenString);
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    if (error.response?.status === 403) {
      // Handle forbidden error - could be auth issue
      console.error('Authentication error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // console.log('Token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
