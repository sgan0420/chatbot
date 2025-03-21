import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChatbots } from "../services/apiService";
import "../styles/BotsPage.css";

const BotsPage = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await getUserChatbots();
        setBots(response.chatbots || []);
      } catch (error) {
        console.error("Error fetching bots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, []);

  return (
    <div className="bots-page">
      <h2>Your Bots</h2>

      {loading ? (
        <div className="loading">Loading your bots...</div>
      ) : (
        <div className="bot-list">
          {bots.map((bot) => (
            <div key={bot.id} className="bot-card">
              <h3>{bot.name}</h3>
              <p>{bot.description}</p>
              <div className="bot-actions">
                <button
                  className="details-button"
                  onClick={() => navigate(`/bot/${bot.id}`)}
                >
                  Details
                </button>
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
      )}

      {/* Create Button */}
      <button className="create-bot" onClick={() => navigate("/create-bot")}>
        Create New Bot
      </button>
    </div>
  );
};

export default BotsPage;
