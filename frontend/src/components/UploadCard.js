import { useState } from "react";
import "../styles/UploadCard.css"; // Import the CSS file

function UploadCard({ title, description, advanced = false }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file.name);
    }
  };

  return (
    <div className="upload-card">
      <h4 className="upload-title">{title}</h4>
      <p className="upload-description">{description}</p>

      {advanced && <p className="upload-pricing">View pricing</p>}

      <label className="upload-button-wrapper">
        <input
          type="file"
          className="upload-input"
          onChange={handleFileChange}
        />
        <button className="upload-button">Upload</button>
      </label>

      {selectedFile && <p className="upload-file">Selected: {selectedFile}</p>}
    </div>
  );
}

export default UploadCard;
