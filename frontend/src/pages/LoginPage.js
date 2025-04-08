import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/AuthPage.css";

function LoginPage() {
  const { isRegister, toggleRegister, login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get the route they were trying to access
  const from = location.state?.from?.pathname || "/dashboard";

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (isRegister && !fullName.trim()) {
      setError("Full name is required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!isRegister) {
        await login(email, password, rememberMe);
      } else {
        await signup(email, password, fullName);
      }

      // Navigate to the page they were trying to access
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="modal-title">
          {isRegister ? "Create an Account" : "Sign In"}
        </h2>

        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="remember-me">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
          )}

          <button
            className={`submit-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {/* Toggle Sign In/Register */}
        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span className="toggle-link" onClick={toggleRegister}>
            {isRegister ? "Sign in" : "Register"}
          </span>
        </p>

        {!isRegister && (
          <div className="forgot-password">
            <a href="/reset-password">Forgot your password?</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
