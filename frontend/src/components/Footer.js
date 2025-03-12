import "../styles/Footer.css"; // Import the CSS file

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>Use Cases</h4>
          <ul>
            <li>UI Design</li>
            <li>UX Design</li>
            <li>Wireframing</li>
            <li>Diagramming</li>
            <li>Brainstorming</li>
            <li>Online Whiteboard</li>
            <li>Team Collaboration</li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Explore</h4>
          <ul>
            <li>Design</li>
            <li>Prototyping</li>
            <li>Development Features</li>
            <li>Design Systems</li>
            <li>Collaboration Features</li>
            <li>Design Process</li>
            <li>FigJam</li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Resources</h4>
          <ul>
            <li>Blog</li>
            <li>Best Practices</li>
            <li>Colors</li>
            <li>Color Wheel</li>
            <li>Support</li>
            <li>Developers</li>
            <li>Resource Library</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
