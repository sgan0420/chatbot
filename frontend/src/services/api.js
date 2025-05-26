import axios from "axios";
import { logout } from "./apiService"; // Import the logout function from apiService.js

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 30000,
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

// Add a response interceptor to catch 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If error response is 401, then session is likely expired
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      try {
        // If you have a refresh token flow, you could try refreshing the token here:
        // const originalRequest = error.config;
        // const { data } = await axios.post('/refresh-token', { refreshToken: yourRefreshToken });
        // setAccessToken(data.accessToken);
        // originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        // return axios(originalRequest);

        // If not, simply log the user out and redirect to login
        logout(); // clear tokens and user state
        window.location.href = "/login"; // or use your router to navigate
      } catch (refreshError) {
        // If refresh fails, log out.
        logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
