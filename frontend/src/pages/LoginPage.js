import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation
import "../styles/AuthPage.css";

function LoginPage() {
  const { isRegister, toggleRegister, login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Added fullName state for signup
  const navigate = useNavigate(); // Initialize navigation

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isRegister) {
      login(email, password);
      navigate("/dashboard");
    } else {
      signup(email, password, fullName); // Call signup function instead of alert
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="modal-title">
          {isRegister ? "Create an Account" : "Sign In"}
        </h2>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="submit-button">
            {isRegister ? "Register" : "Sign In"}
          </button>
        </form>

        {/* Toggle Sign In/Register */}
        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span className="toggle-link" onClick={toggleRegister}>
            {isRegister ? "Sign in" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
