import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  chat,
  getChatHistory,
  createChatSession,
  getChatSessions,
  deleteChatSession,
} from "../services/apiService";

function ChatPage() {
  const { id: chatbot_id } = useParams();

  const [sessionId, setSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
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

  // When sessionId changes, fetch chat history.
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const history = await getChatHistory({
          chatbot_id,
          session_id: sessionId,
        });
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
    if (sessionId) fetchChatHistory();
  }, [chatbot_id, sessionId]);

  const handleSessionClick = (session) => {
    setSessionId(session.id);
  };

  const handleNewChat = async () => {
    try {
      const sessionResponse = await createChatSession(chatbot_id);
      const newSessionId = sessionResponse.session_id;
      setSessionId(newSessionId);
      setMessages([]);
      const sessionsResponse = await getChatSessions(chatbot_id);
      setChatSessions(sessionsResponse.sessions);
    } catch (err) {
      console.error("Failed to create a new chat session:", err);
    }
  };

  const handleDeleteSession = async (session) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteChatSession(session.id, chatbot_id);
        if (session.id === sessionId) {
          setSessionId(null);
          setMessages([]);
        }
        const sessionsResponse = await getChatSessions(chatbot_id);
        setChatSessions(sessionsResponse.sessions);
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await createChatSession(chatbot_id);
        currentSessionId = sessionResponse.session_id;
        setSessionId(currentSessionId);
        const sessionsResponse = await getChatSessions(chatbot_id);
        setChatSessions(sessionsResponse.sessions);
      }
      const chatRequest = {
        chatbot_id,
        session_id: currentSessionId,
        query: userMessage.content,
      };
      const response = await chat(chatRequest);
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
    // Fullscreen container without additional margins or footer
    <div className="flex w-full" style={{ height: "calc(100vh - 64px)" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Chat Sessions
        </h3>
        <button
          className="mb-4 w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleNewChat}
        >
          New Chat
        </button>
        <ul>
          {chatSessions.map((session) => (
            <li
              key={session.id}
              className="flex justify-between items-center cursor-pointer p-2 border-b border-gray-200 hover:bg-gray-100"
              onClick={() => handleSessionClick(session)}
            >
              <span>{session.name || session.id}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session);
                }}
                className="text-red-500 hover:text-red-700"
                title="Delete Session"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
        <h2 className="text-2xl font-semibold text-center p-4 border-b border-gray-200">
          Chat with Your Bot
        </h2>
        {/* Chat history set to flex-1 scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-xs p-2 rounded ${
                  msg.role === "user"
                    ? "bg-green-200 text-gray-900"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {msg.content}
              </p>
            </div>
          ))}
        </div>
        {error && (
          <div className="text-red-500 text-center mb-2 p-2">{error}</div>
        )}
        {/* Chat input area anchored to bottom */}
        <div className="mt-auto p-4 border-t border-gray-200 flex">
          <textarea
            className="flex-1 p-2 border border-gray-300 rounded resize-none"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
