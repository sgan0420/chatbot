import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Add request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token to headers
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for handling global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "API Error:",
        error.response.data.message || error.response.statusText,
      );
    }
    return Promise.reject(error);
  },
);

export default api;
