import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/gasy_logo.jpeg";
import "../styles/NavBar.css"; // Import the CSS file

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
          <button className="sign-in">Sign in</button>
          <button className="register">Register</button>
        </div>

        {/* Mobile Menu Button */}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
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
          <button className="sign-in">Sign in</button>
          <button className="register">Register</button>
        </nav>
      )}
    </header>
  );
}

export default NavBar;
