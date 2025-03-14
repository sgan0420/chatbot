import { createContext, useState, useContext, useEffect } from "react";

// Create Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Check if user is already logged in (e.g., from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email, password) => {
    // Simulate API call (replace with actual API)
    const fakeUser = { id: 1, email: "123@gmail.com" };
    console.log("Logging in", fakeUser);
    setUser(fakeUser);
    localStorage.setItem("user", JSON.stringify(fakeUser)); // Persist login
    closeAuth();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user"); // Remove user from storage
  };

  const openSignIn = () => {
    setIsRegister(false);
    // setIsAuthOpen(true);
  };

  const openRegister = () => {
    setIsRegister(true);
    // setIsAuthOpen(true);
  };

  const toggleRegister = () => {
    setIsRegister(!isRegister);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthOpen,
        isRegister,
        openSignIn,
        openRegister,
        toggleRegister,
        closeAuth,
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
