import { useState } from "react";
import "../App.css";

const BotSettingsForm = () => {
  const [botName, setBotName] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const botData = { botName, privacy, aiModel, language, description };
    console.log("Bot Data Submitted:", botData);
  };

  return (
    <div className="bot-settings-form">
      <div className="form-container">
        <img src="/bot-avatar.png" alt="Bot Avatar" className="bot-avatar" />
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Your bot’s name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="input"
          />

          <div className="grid-2">
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="select"
            >
              <option value="">Select Privacy</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="select"
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
          >
            <option value="">Select Language</option>
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="chinese">Chinese</option>
          </select>

          <textarea
            placeholder="e.g. You are my personal tutor which helps me with my math homework"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea"
          />

          <button type="submit" className="submit-button">
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default BotSettingsForm;
