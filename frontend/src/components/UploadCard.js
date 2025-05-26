import React, { useState, useRef } from "react";
import "../styles/UploadCard.css";

function UploadCard({ title, description, advanced = false, onFileSelect }) {
  const fileInputRef = useRef(null);

  // Define allowed file types based on title
  const fileTypes = {
    "PDF files": ".pdf",
    "Word files": ".doc,.docx",
    "CSV files": ".csv",
    "Text files": ".txt",
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      // Reset file input to allow selecting the same file again
      fileInputRef.current.value = null;
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="upload-card">
      <h4 className="upload-title">{title}</h4>
      <p className="upload-description">{description}</p>

      {/* File Selection Button */}
      <button className="upload-button" onClick={handleUploadClick}>
        Select File
      </button>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        style={{ display: "none" }}
        accept={fileTypes[title] || "*"}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default UploadCard;
