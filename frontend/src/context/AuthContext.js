import { createContext, useState, useContext, useEffect } from "react";
import {
  loginUser,
  signupUser,
  logout as apiLogout,
} from "../services/apiService";

// Create Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in (e.g., from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Log in a user
  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);
      const { user, accessToken } = await loginUser(email, password);

      if (accessToken) {
        // Store token as "token" for Axios interceptor compatibility
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
      }
    } catch (error) {
      setError(error.message || "Authentication failed");
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up a new user
  const signup = async (email, password, display_name) => {
    try {
      setError(null);
      setIsLoading(true);
      const { user, accessToken } = await signupUser(
        email,
        password,
        display_name,
      );

      if (accessToken) {
        // Store token as "token"
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
      }
    } catch (error) {
      setError(error.message || "Signup failed");
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Log out the user
  const logout = () => {
    apiLogout(); // Clear token and reset Axios headers
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // UI control functions
  const openSignIn = () => setIsRegister(false);
  const openRegister = () => setIsRegister(true);
  const toggleRegister = () => setIsRegister(!isRegister);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        isLoading,
        error,
        logout,
        isRegister,
        openSignIn,
        openRegister,
        toggleRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}
