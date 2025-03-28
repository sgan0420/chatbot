import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { chat, getChatHistory } from "../services/apiService";
import { v4 as uuidv4 } from "uuid"; // install uuid if needed: npm i uuid
import "../styles/ChatPage.css";

function ChatPage() {
  // Get chatbot id from URL
  const { id: chatbot_id } = useParams();
  
  // Manage a session id via state; try to load from sessionStorage, or else generate a new one.
  const [sessionId, setSessionId] = useState(() => {
    const stored = sessionStorage.getItem("session_id");
    if (stored) return stored;
    const newSession = uuidv4();
    sessionStorage.setItem("session_id", newSession);
    return newSession;
  });

  // Messages are stored as objects with a role ("user" or "bot") and content.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch chat history on mount; pass chatbot_id and sessionId if required by your endpoint.
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // getChatHistory may need to be updated to accept chatbot_id & sessionId; adjust the API call accordingly.
        const history = await getChatHistory({ chatbot_id, session_id: sessionId });
        setMessages(history);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchChatHistory();
  }, [chatbot_id, sessionId]);

  // Handle message send
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      // Construct request object per your ChatRequest model.
      const chatRequest = {
        chatbot_id,
        session_id: sessionId,
        query: userMessage.content
      };
      const response = await chat(chatRequest);
      // Assuming response.message is the bot reply.
      const botMessage = { role: "bot", content: response.message };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow sending message with Enter key (without Shift)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page">
      <h2>Chat with Your Bot</h2>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="chat-input">
        <textarea
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ChatPage;