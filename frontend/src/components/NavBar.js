import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import logo from "../assets/gasy_logo.jpeg";
import { useAuth } from "../context/AuthContext"; // Import Auth Context
import "../styles/NavBar.css";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, openSignIn, openRegister } = useAuth();
  const navigate = useNavigate(); // Initialize navigation

  // Handle navigation and close menu
  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="logo">
            <Link to="/">
              <img src={logo} alt="Logo" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <nav className="nav-links">
            <a className="nav-link" onClick={() => navigate("/")}>
              Home
            </a>
            <a className="nav-link" onClick={() => navigate("/dashboard")}>
              Dashboard
            </a>
            <a className="nav-link" onClick={() => navigate("/bots")}>
              Bots
            </a>
            {/* <a className="nav-link" onClick={() => navigate("/developers")}>
              Developers
            </a>
            <a className="nav-link" onClick={() => navigate("/resources")}>
              Resources
            </a> */}
            <a className="nav-link" onClick={() => navigate("/faq")}>
              FAQ
            </a>
            {/* <a className="nav-link" onClick={() => navigate("/contact")}>
              Contact
            </a> */}
          </nav>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            {user ? (
              <>
                <span className="user-display-name">
                  {user.user_metadata?.display_name || user.email}
                </span>
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="sign-in"
                  onClick={() => {
                    navigate("/login");
                    openSignIn();
                  }}
                >
                  Sign in
                </button>
                <button
                  className="register"
                  onClick={() => {
                    navigate("/login");
                    openRegister();
                  }}
                >
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
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/")}
            >
              Home
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/dashboard")}
            >
              Dashboard
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/bots")}
            >
              Bots
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/developers")}
            >
              Developers
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/resources")}
            >
              Resources
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/faq")}
            >
              FAQ
            </a>
            <a
              className="mobile-nav-link"
              onClick={() => handleNavigation("/contact")}
            >
              Contact
            </a>
            {user ? (
              <>
                <span className="user-email">
                  {user.user_metadata?.display_name || user.email}
                </span>
                <button className="logout-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="sign-in"
                  onClick={() => {
                    handleNavigation("/login");
                    openSignIn();
                  }}
                >
                  Sign in
                </button>
                <button
                  className="register"
                  onClick={() => {
                    handleNavigation("/login");
                    openRegister();
                  }}
                >
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
