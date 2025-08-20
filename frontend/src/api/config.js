import axios from "axios";

export const API_URL = `${process.env.HOST_URL}:8000`;

const getCSRFToken = () => {
  const match = document.cookie.match(/csrftoken=([\w-]+)/);
  return match ? match[1] : "";
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const tokenString = localStorage.getItem("token");
    if (tokenString) {
      const { access } = JSON.parse(tokenString);
      config.headers.Authorization = `Bearer ${access}`;
    }
    if (config.url && !config.url.endsWith("/")) {
      config.url += "/";
    }
    // add CSRF token for unsafe methods
    if (["post", "patch", "put", "delete"].includes(config.method)) {
      config.headers["X-CSRFToken"] = getCSRFToken();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error);
    if (error.response?.status === 403) {
      // Handle forbidden error - could be auth issue
      console.error("Authentication error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
