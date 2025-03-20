import { useState } from "react";
import "../App.css";
import robot from "../assets/robot.jpeg";
import { createChatbot } from "../services/apiService"; // Import API function

const BotSettingsForm = ({ botData, setBotData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBotData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      await createChatbot(botData);
      setSuccessMessage("Chatbot settings saved successfully!");
      // Optionally clear botData if desired:
      // setBotData({ name: "", description: "" });
    } catch (err) {
      setError("Failed to save chatbot settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bot-settings-form">
      <div className="form-container">
        <img src={robot} alt="Bot Avatar" className="bot-avatar" />
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Your bot's name"
            value={botData.name || ""}
            onChange={handleChange}
            className="input"
            required
          />

          {/* <div className="grid-2">
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="select"
              required
            >
              <option value="">Select Privacy</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="select"
              required
            >
              <option value="">Select AI Model</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
            </select>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="select"
            required
          >
            <option value="">Select Language</option>
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="chinese">Chinese</option>
          </select> */}

          <textarea
            placeholder="e.g. You are my personal tutor which helps me with my math homework"
            value={botData.description || ""}
            onChange={handleChange}
            className="textarea"
          />

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>

          {error && <p className="error-message">{error}</p>}
          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default BotSettingsForm;
