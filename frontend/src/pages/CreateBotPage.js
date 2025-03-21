import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BotSettingsForm from "../components/BotSettingForm";
import UploadCard from "../components/UploadCard";
import {
  createChatbot,
  updateChatbot,
  uploadDocument,
  getChatbot,
} from "../services/apiService";
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
    { title: "Oracle", description: "Provide structured database queries." },
    { title: "JSONL", description: "Upload JSONL formatted data." },
    { title: "RAW files", description: "Upload raw text data." },
    { title: "XML files", description: "Upload structured XML files." },
    { title: "Text files", description: "Upload plain text documents." },
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

  // Upload function with dynamic progress
  const uploadFiles = async (chatbotId) => {
    const totalFiles = selectedFiles.length;
    if (totalFiles === 0) return;

    for (let i = 0; i < totalFiles; i++) {
      // Extract the file (ignore fileType since the uploadDocument function creates its own FormData)
      const { file } = selectedFiles[i];

      try {
        // Pass the raw file to uploadDocument (no need to pre-create FormData)
        await uploadDocument(chatbotId, file);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (error) {
        console.error("File upload failed:", error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
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
