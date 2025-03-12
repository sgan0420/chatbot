import { useState, useRef } from "react";
import axios from "../services/api"; // Import the Axios instance
import "../styles/UploadCard.css";

function UploadCard({ title, description, advanced = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null); // Create a ref for the file input

  // Define allowed file types based on title
  const fileTypes = {
    "PDF files": ".pdf",
    "Q&As": ".csv,.json,.txt",
    URLs: ".txt",
    "CSV files": ".csv",
    Oracle: ".json,.csv",
    JSONL: ".jsonl",
    "RAW files": ".txt,.json,.csv",
    "XML files": ".xml",
    "Text files": ".txt",
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      await handleUpload(file); // Automatically trigger upload
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click(); // Open file selection dialog
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", title); // Pass file type for backend processing

    try {
      const response = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadStatus(`Upload successful: ${response.data.message}`);
      setSelectedFile(null);
    } catch (error) {
      setUploadStatus(
        `Upload failed: ${error.response?.data || error.message}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <h4 className="upload-title">{title}</h4>
      <p className="upload-description">{description}</p>

      {advanced && <p className="upload-pricing">View pricing</p>}

      {/* File Selection Button */}
      <button
        className="upload-button"
        onClick={handleUploadClick}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={fileTypes[title] || "*"}
        onChange={handleFileChange} // Triggers upload automatically
      />

      {uploadStatus && (
        <p
          className={`upload-status ${uploadStatus.includes("failed") ? "error" : "success"}`}
        >
          {uploadStatus}
        </p>
      )}
    </div>
  );
}

export default UploadCard;
