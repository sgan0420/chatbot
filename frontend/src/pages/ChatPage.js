import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  chat,
  getChatHistory,
  createChatSession,
  getChatSessions,
} from "../services/apiService";
import "../styles/ChatPage.css";

function ChatPage() {
  // Get chatbot id from URL.
  const { id: chatbot_id } = useParams();

  // Initially no session is selected.
  const [sessionId, setSessionId] = useState(null);
  // Chat sessions list for the sidebar.
  const [chatSessions, setChatSessions] = useState([]);
  // Current conversation messages.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch chat sessions on mount.
  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const response = await getChatSessions(chatbot_id);
        setChatSessions(response.sessions);
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }
    };
    fetchChatSessions();
  }, [chatbot_id]);

  // When sessionId changes, fetch its chat history.
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const history = await getChatHistory({
          chatbot_id,
          session_id: sessionId,
        });

        // Transform the array: even index => user, odd index => bot.
        // Adjust this logic if your ordering or logic is different.
        const transformedMessages = (history.messages || []).map(
          (msg, index) => ({
            role: index % 2 === 0 ? "user" : "bot",
            content: msg.message,
          }),
        );

        setMessages(transformedMessages);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    if (sessionId) {
      fetchChatHistory();
    }
  }, [chatbot_id, sessionId]);

  // Handle clicking a session from the sidebar.
  const handleSessionClick = (session) => {
    setSessionId(session.id);
    // setMessages([]); // Clear messages when switching sessions.
  };

  // Handle sending a message.
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input.trim() };
    // Add the user's message to the conversation.
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      let currentSessionId = sessionId;
      // If no session exists, create one when the first message is sent.
      if (!currentSessionId) {
        const sessionResponse = await createChatSession(chatbot_id);
        currentSessionId = sessionResponse.session_id;
        setSessionId(currentSessionId);

        // Refresh the chat sessions list.
        const sessionsResponse = await getChatSessions(chatbot_id);
        setChatSessions(sessionsResponse.sessions);
      }

      // Prepare the chat request.
      const chatRequest = {
        chatbot_id,
        session_id: currentSessionId,
        query: userMessage.content,
      };
      const response = await chat(chatRequest);
      // Assume that response.answer contains the bot's reply.
      const botMessage = { role: "bot", content: response.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page">
      {/* Sidebar with chat sessions */}
      <aside className="chat-sidebar">
        <h3>Chat Sessions</h3>
        <ul>
          {chatSessions.map((session) => (
            <li
              key={session.id}
              className={session.id === sessionId ? "active" : ""}
              onClick={() => handleSessionClick(session)}
            >
              {session.name || session.id}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main chat area */}
      <div className="chat-main">
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
    </div>
  );
}

export default ChatPage;
