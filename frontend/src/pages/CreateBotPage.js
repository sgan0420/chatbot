import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BotSettingsForm from "../components/BotSettingForm";
import UploadCard from "../components/UploadCard";
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
  const botId = queryParams.get("id"); // Get bot ID from URL
  const isEditMode = Boolean(botId); // If there's an ID, we're in edit mode

  const [botData, setBotData] = useState({
    name: "",
    description: "",
  });

  // Fetch bot details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      // Simulate fetching bot details (replace with real API call)
      setBotData({
        name: `ChatBot ${botId}`,
        description: `This is a placeholder description for bot ${botId}.`,
      });
    }
  }, [botId, isEditMode]);

  const handleSubmit = () => {
    if (isEditMode) {
      console.log("Updating bot:", botData);
      alert("Bot updated successfully!");
    } else {
      console.log("Creating new bot:", botData);
      alert("Bot created successfully!");
    }
    navigate("/bots"); // Redirect back to bots list
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
            />
          ))}
        </div>
      </div>

      {/* Create or Save Button */}
      <button className="create-save-button" onClick={handleSubmit}>
        {isEditMode ? "Save" : "Create"}
      </button>
    </div>
  );
}

export default CreateBotPage;
