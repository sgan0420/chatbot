import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation
import { getChatbots } from "../services/apiService";
import "../styles/BotsPage.css";

const BotsPage = () => {
  const [bots, setBots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setBots([
      {
        id: 1,
        name: "ChatBot Alpha",
        description: "AI-powered chatbot for customer support.",
        image: "https://via.placeholder.com/80",
      },
      {
        id: 2,
        name: "ChatBot Beta",
        description: "Automated assistant for e-commerce.",
        image: "https://via.placeholder.com/80",
      },
      {
        id: 3,
        name: "ChatBot Gamma",
        description: "Conversational AI for education.",
        image: "https://via.placeholder.com/80",
      },
    ]);
  }, []);

  return (
    <div className="bots-page">
      <h2>Your Bots</h2>
      <div className="bot-list">
        {bots.map((bot) => (
          <div key={bot.id} className="bot-card">
            <h3>{bot.name}</h3>
            <p>{bot.description}</p>
            <div className="bot-actions">
              <button onClick={() => navigate(`/embed/${bot.id}`)}>
                Embed
              </button>
              <button
                className="edit-button"
                onClick={() => navigate(`/create-bot?edit=true&id=${bot.id}`)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Create Button */}
      <button className="create-bot" onClick={() => navigate("/create-bot")}>
        Create New Bot
      </button>
    </div>
  );
};

export default BotsPage;
