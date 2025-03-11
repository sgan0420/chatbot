import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "../styles/AuthModal.css";

function AuthModal() {
  const { isAuthOpen, isRegister, toggleRegister, closeAuth, login } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isAuthOpen) return null; // Don't render if modal is not open

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isRegister) {
      login(email, password); // Call login function from AuthContext
    } else {
      alert("Register function not implemented yet.");
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuth}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-button" onClick={closeAuth}>
          x
        </button>

        {/* Title */}
        <h2 className="modal-title">
          {isRegister ? "Create an Account" : "Sign In"}
        </h2>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && <input type="text" placeholder="Full Name" required />}
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
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

export default AuthModal;
