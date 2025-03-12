import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/gasy_logo.jpeg";
import { useAuth } from "../context/AuthContext"; // Import Auth Context
import "../styles/NavBar.css";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, openSignIn, openRegister } = useAuth(); // Use AuthContext

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>

          {/* Desktop Menu */}
          <nav className="nav-links">
            <a href="#">Pricing</a>
            <a href="#">Solutions</a>
            <a href="#">Developers</a>
            <a href="#">Resources</a>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
          </nav>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="sign-in" onClick={openSignIn}>
                  Sign in
                </button>
                <button className="register" onClick={openRegister}>
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="mobile-menu">
            <a href="#">Pricing</a>
            <a href="#">Solutions</a>
            <a href="#">Developers</a>
            <a href="#">Resources</a>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="sign-in" onClick={openSignIn}>
                  Sign in
                </button>
                <button className="register" onClick={openRegister}>
                  Register
                </button>
              </>
            )}
          </nav>
        )}
      </header>
    </>
  );
}

export default NavBar;
