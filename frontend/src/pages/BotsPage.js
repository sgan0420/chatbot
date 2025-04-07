import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChatbots, deleteChatbot } from "../services/apiService";
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Your Bots</h2>
        <button
          className="bg-gradient-to-r from-gray-800 to-black text-white font-medium py-2 px-5 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          onClick={() => navigate("/create-bot")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Bot
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16 text-gray-600 bg-gray-50 rounded-lg shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xl mb-2">No bots found</p>
          <p className="mb-8">Create your first bot to get started</p>
          <button
            className="bg-gradient-to-r from-gray-800 to-black text-white font-medium py-2 px-5 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
            onClick={() => navigate("/create-bot")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {bot.name}
                </h3>
                <p className="text-gray-600 mb-4 h-12 overflow-hidden text-ellipsis">
                  {bot.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/bot/${bot.id}/chat`)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    Chat
                  </button>
                  <button
                    className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/bot/${bot.id}`)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Details
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                    onClick={() =>
                      navigate(`/create-bot?edit=true&id=${bot.id}`)
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="flex-1 bg-violet-50 text-violet-600 hover:bg-violet-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                    onClick={() => navigate(`/embed/${bot.id}`)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    Embed
                  </button>
                </div>
                <button
                  className="w-full mt-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete "${bot.name}"?`,
                      )
                    ) {
                      deleteChatbot(bot.id)
                        .then(() => {
                          setBots((prevBots) =>
                            prevBots.filter((b) => b.id !== bot.id),
                          );
                        })
                        .catch((error) => {
                          console.error("Error deleting bot:", error);
                          alert("Failed to delete bot. Please try again.");
                        });
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotsPage;
