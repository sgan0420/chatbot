import "../styles/AuthModal.css";

function AuthModal({ isOpen, onClose, isRegister }) {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>
          X
        </button>

        {/* Title */}
        <h2 className="modal-title">
          {isRegister ? "Create an Account" : "Sign In"}
        </h2>

        {/* Form */}
        <form className="auth-form">
          {isRegister && <input type="text" placeholder="Full Name" required />}
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button className="submit-button">
            {isRegister ? "Register" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
