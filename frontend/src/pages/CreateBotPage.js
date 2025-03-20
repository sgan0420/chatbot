import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BotSettingsForm from "../components/BotSettingForm";
import UploadCard from "../components/UploadCard";
import { createChatbot, uploadDocument } from "../services/apiService";
import "../styles/CreateBotPage.css";

const uploadOptions = {
  basic: [
    { title: "PDF files", description: "Upload PDF files containing texts." },
    {
      title: "Q&As",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "URLs",
      description: "Answers based on the content of the webpage.",
    },
  ],
  advanced: [
    { title: "CSV files", description: "Upload CSV files containing texts." },
    {
      title: "Oracle",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "JSONL",
      description: "Answers based on the content of the webpage.",
    },
    { title: "RAW files", description: "Upload raw files containing texts." },
    {
      title: "XML files",
      description: "Provide frequently asked questions and answers.",
    },
    {
      title: "Text files",
      description: "Answers based on the content of the webpage.",
    },
  ],
};

function CreateBotPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const botId = queryParams.get("id");
  const isEditMode = Boolean(botId);

  const [botData, setBotData] = useState({
    name: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch bot details if in edit mode (your existing code)
  useEffect(() => {
    if (isEditMode) {
      // Your existing code to fetch bot details
      setBotData({
        name: `ChatBot ${botId}`,
        description: `This is a placeholder description for bot ${botId}.`,
      });
    }
  }, [botId, isEditMode]);

  // Handle file selection from UploadCard
  const handleFileSelect = (file, fileType) => {
    setSelectedFiles((prev) => [...prev, { file, fileType }]);
  };

  // Remove a file from the selected files list
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit handler - creates bot and uploads files
  const handleSubmit = async () => {
    if (!botData.name) {
      alert("Bot name is required!");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Step 1: Create or update the bot
      let newBotId;

      if (isEditMode) {
        // Update existing bot (replace with your API call)
        console.log("Updating bot:", botData);
        newBotId = botId; // Use existing bot ID
      } else {
        // Create new bot
        const response = await createChatbot(botData);
        console.log("Bot created:", response);
        newBotId = response.id; // Get the new bot ID
      }

      // Step 2: Upload all selected files
      if (selectedFiles.length > 0 && newBotId) {
        const totalFiles = selectedFiles.length;

        for (let i = 0; i < totalFiles; i++) {
          const { file, fileType } = selectedFiles[i];

          const formData = new FormData();
          formData.append("file", file);
          formData.append("filetype", fileType);
          formData.append("filename", file.name);

          await uploadDocument(newBotId, formData);

          // Update progress
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      }

      alert(
        isEditMode
          ? "Bot updated and files uploaded successfully!"
          : "Bot created and files uploaded successfully!",
      );

      navigate("/bots"); // Redirect to bots page
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      {/* Bot Settings Form */}
      <div className="bot-setting-container">
        <BotSettingsForm botData={botData} setBotData={setBotData} />
      </div>

      {/* Upload Section */}
      <div className="upload-data-form">
        <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>

        {/* Basic Upload Options */}
        <h3 className="text-lg font-medium mt-8 mb-6">Basic</h3>
        <div className="upload-grid">
          {uploadOptions.basic.map((option, index) => (
            <UploadCard
              key={index}
              title={option.title}
              description={option.description}
              onFileSelect={(file) => handleFileSelect(file, option.title)}
            />
          ))}
        </div>

        {/* Advanced Upload Options */}
        <h3 className="text-lg font-medium mt-8 mb-6">Advanced</h3>
        <div className="upload-grid">
          {uploadOptions.advanced.map((option, index) => (
            <UploadCard
              key={index}
              title={option.title}
              description={option.description}
              advanced
              onFileSelect={(file) => handleFileSelect(file, option.title)}
            />
          ))}
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Files to Upload ({selectedFiles.length})</h3>
          <ul>
            {selectedFiles.map((item, index) => (
              <li key={index} className="file-item">
                <span className="file-name">{item.file.name}</span>
                <span className="file-type">{item.fileType}</span>
                <span className="file-size">
                  ({(item.file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  className="remove-file"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isSubmitting}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span>{uploadProgress}% complete</span>
        </div>
      )}

      {/* Create or Save Button */}
      <button
        className="create-save-button"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isEditMode
            ? "Saving..."
            : "Creating..."
          : isEditMode
            ? "Save"
            : "Create"}
      </button>
    </div>
  );
}

export default CreateBotPage;
