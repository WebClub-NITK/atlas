import axios from 'axios';

export const API_URL = `${process.env.HOST_URL}:8000`;

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



export default apiClient;
