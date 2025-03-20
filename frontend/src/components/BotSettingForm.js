import { useState } from "react";
import "../App.css";
import robot from "../assets/robot.jpeg";

const BotSettingsForm = ({ botData, setBotData }) => {
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBotData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bot-settings-form">
      <div className="form-container">
        <img src={robot} alt="Bot Avatar" className="bot-avatar" />
        <div className="form">
          <input
            type="text"
            name="name"
            placeholder="Your bot's name"
            value={botData.name || ""}
            onChange={handleChange}
            className="input"
            required
          />
          <textarea
            name="description"
            placeholder="e.g. You are my personal tutor which helps me with my math homework"
            value={botData.description || ""}
            onChange={handleChange}
            className="textarea"
          />
        </div>
      </div>
    </div>
  );
};

export default BotSettingsForm;
