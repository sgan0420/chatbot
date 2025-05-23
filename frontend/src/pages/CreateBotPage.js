import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BotSettingsForm from "../components/BotSettingForm";
import UploadCard from "../components/UploadCard";
import {
  createChatbot,
  updateChatbot,
  uploadDocument,
  processDocument,
  getChatbot,
} from "../services/apiService";
import "../styles/CreateBotPage.css";
import { ArrowRight, Check, Upload, X } from "lucide-react";

const uploadOptions = {
  basic: [
    {
      title: "PDF files",
      description: "Upload PDF files containing texts.",
      icon: "📄",
    },
    {
      title: "Q&As",
      description: "Provide frequently asked questions and answers.",
      icon: "❓",
    },
    {
      title: "CSV files",
      description: "Upload CSV files containing texts.",
      icon: "📊",
    },
    {
      title: "Word files",
      description: "Upload Word documents containing texts.",
      icon: "📝",
    },
    {
      title: "Text files",
      description: "Upload plain text documents.",
      icon: "📄",
    },
    {
      title: "JSONL",
      description: "Upload JSONL formatted data.",
      icon: "📋",
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch bot details in edit mode
  useEffect(() => {
    if (isEditMode && botId) {
      const fetchBot = async () => {
        try {
          const bot = await getChatbot(botId);
          setBotData({
            id: bot.id,
            name: bot.name,
            description: bot.description,
          });
          // If we have existing data, move to step 2
          setCurrentStep(2);
        } catch (error) {
          console.error("Error fetching bot details:", error);
        }
      };
      fetchBot();
    }
  }, [botId, isEditMode]);

  // Handle file selection
  const handleFileSelect = (file, fileType) => {
    setSelectedFiles((prev) => [...prev, { file, fileType }]);
  };

  // Remove file from the list
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      // Determine file type from extension
      const extension = file.name.split(".").pop().toLowerCase();
      let fileType = "Text files";

      if (extension === "pdf") fileType = "PDF files";
      else if (extension === "csv") fileType = "CSV files";
      else if (extension === "doc" || extension === "docx")
        fileType = "Word files";
      else if (extension === "txt") fileType = "Text files";
      else if (extension === "jsonl") fileType = "JSONL";

      handleFileSelect(file, fileType);
    });
  };

  // Upload function with dynamic progress
  const uploadFiles = async (chatbotId) => {
    const totalFiles = selectedFiles.length;
    if (totalFiles === 0) return;

    for (let i = 0; i < totalFiles; i++) {
      // Extract the file
      const { file } = selectedFiles[i];

      try {
        await uploadDocument(chatbotId, file);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (error) {
        console.error("File upload failed:", error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
    // Process the documents after upload
    try {
      await processDocument(chatbotId);
      setUploadProgress(100); // Set progress to 100% after processing
    } catch (error) {
      console.error("Document processing failed:", error);
      alert("Failed to process documents. Please try again.");
    }
  };

  // Handle transition to next step
  const goToNextStep = () => {
    if (currentStep === 1 && !botData.name) {
      alert("Bot name is required!");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Handle going back a step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle bot creation/update & file upload
  const handleSubmit = async () => {
    if (!botData.name) {
      alert("Bot name is required!");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let newBotId = botId;

      if (isEditMode && botId) {
        await updateChatbot(botId, botData);
      } else {
        const response = await createChatbot(botData);
        newBotId = response.id;
        setBotData((prev) => ({ ...prev, id: response.id }));
      }

      await uploadFiles(newBotId);

      alert(
        isEditMode ? "Bot updated successfully!" : "Bot created successfully!",
      );
      navigate("/bots");
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-bot-container">
      <h1 className="page-title">
        {isEditMode ? "Edit Your Chatbot" : "Create a New Chatbot"}
      </h1>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
          <div className="step-number">
            {currentStep > 1 ? <Check size={20} /> : 1}
          </div>
          <span>Bot Settings</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
          <div className="step-number">
            {currentStep > 2 ? <Check size={20} /> : 2}
          </div>
          <span>Upload Data</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-number">3</div>
          <span>Review & Create</span>
        </div>
      </div>

      <div className="step-content">
        {/* Step 1: Bot Settings Form */}
        {currentStep === 1 && (
          <div className="step-panel">
            <div className="bot-setting-container">
              <BotSettingsForm botData={botData} setBotData={setBotData} />
            </div>
            <div className="step-actions">
              <button className="next-button" onClick={goToNextStep}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Section */}
        {currentStep === 2 && (
          <div className="step-panel">
            <div className="upload-data-form">
              <h2>Upload Your Training Data</h2>
              <p className="upload-info">
                Upload files to train your chatbot. The more relevant data you
                provide, the better your chatbot will perform.
              </p>

              {/* Drag and Drop Area */}
              <div
                className={`drag-drop-area ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={48} className="upload-icon" />
                <h3>Drag & Drop Files Here</h3>
                <p>or select a file type below</p>
              </div>

              {/* Basic Upload Options */}
              <h3 className="upload-section-title">Available File Types</h3>
              <div className="upload-grid">
                {uploadOptions.basic.map((option, index) => (
                  <UploadCard
                    key={index}
                    title={option.title}
                    description={option.description}
                    icon={option.icon}
                    onFileSelect={(file) =>
                      handleFileSelect(file, option.title)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="selected-files-container">
                <div className="selected-files">
                  <h3>Selected Files ({selectedFiles.length})</h3>
                  <ul className="files-list">
                    {selectedFiles.map((item, index) => (
                      <li key={index} className="file-item">
                        <div className="file-info">
                          <span className="file-icon">
                            {getFileIcon(item.fileType)}
                          </span>
                          <div className="file-details">
                            <span className="file-name">{item.file.name}</span>
                            <span className="file-meta">
                              {item.fileType} {formatFileSize(item.file.size)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="remove-file-btn"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isSubmitting}
                          aria-label="Remove file"
                        >
                          <X size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="step-actions">
              <button className="back-button" onClick={goToPreviousStep}>
                Back
              </button>
              <button className="next-button" onClick={goToNextStep}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {currentStep === 3 && (
          <div className="step-panel">
            <div className="review-section">
              <h2>Review Your Bot</h2>
              <div className="review-card">
                <h3>Bot Information</h3>
                <div className="review-item">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{botData.name}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Description:</span>
                  <span className="review-value">
                    {botData.description || "No description provided"}
                  </span>
                </div>
              </div>

              <div className="review-card">
                <h3>Upload Summary</h3>
                <div className="review-item">
                  <span className="review-label">Files to upload:</span>
                  <span className="review-value">
                    {selectedFiles.length} files
                  </span>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="file-types-summary">
                    {summarizeFileTypes(selectedFiles).map((type, index) => (
                      <div key={index} className="file-type-badge">
                        {type.type} ({type.count})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="upload-progress-container">
                <h3>Uploading files...</h3>
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{uploadProgress}% complete</span>
                </div>
              </div>
            )}

            <div className="step-actions">
              <button
                className="back-button"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                className="create-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Bot"
                    : "Create Bot"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get icon based on file type
function getFileIcon(fileType) {
  switch (fileType) {
    case "PDF files":
      return "📄";
    case "Q&As":
      return "❓";
    case "CSV files":
      return "📊";
    case "Word files":
      return "📝";
    case "Text files":
      return "📄";
    case "JSONL":
      return "📋";
    default:
      return "📄";
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

// Helper function to summarize file types
function summarizeFileTypes(files) {
  const counts = {};
  files.forEach((item) => {
    counts[item.fileType] = (counts[item.fileType] || 0) + 1;
  });

  return Object.keys(counts).map((type) => ({
    type,
    count: counts[type],
  }));
}

export default CreateBotPage;
