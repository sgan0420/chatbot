import React, { useState, useEffect, useRef } from "react";
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
  const messagesEndRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // New state to track whether we're creating a new chat
  const [isNewChat, setIsNewChat] = useState(false);

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
        // Skip fetching history if we're in the middle of creating a new chat
        if (isNewChat) {
          setIsNewChat(false);
          return;
        }

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
  }, [chatbot_id, sessionId, isNewChat]);

  // Auto-scroll to the most recent message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSessionClick = (session) => {
    setSessionId(session.id);
  };

  const handleNewChat = async () => {
    try {
      const sessionResponse = await createChatSession(chatbot_id);
      const newSessionId = sessionResponse.session_id;
      setIsNewChat(true);
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
    const originalInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    // Add placeholder message while the bot is responding
    const placeholderId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: "...",
        isPlaceholder: true,
        id: placeholderId,
      },
    ]);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        // We're creating a new session from an empty chat
        setIsNewChat(true);
        const sessionResponse = await createChatSession(chatbot_id);
        currentSessionId = sessionResponse.session_id;
        setSessionId(currentSessionId);
        // Update chat sessions list
        const sessionsResponse = await getChatSessions(chatbot_id);
        setChatSessions(sessionsResponse.sessions);

        // Re-initialize the messages array with just our current message to ensure it's displayed
        setMessages([
          { role: "user", content: originalInput },
          {
            role: "bot",
            content: "...",
            isPlaceholder: true,
            id: placeholderId,
          },
        ]);
      }

      const chatRequest = {
        chatbot_id,
        session_id: currentSessionId,
        query: originalInput,
      };
      const response = await chat(chatRequest);

      // Replace placeholder with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isPlaceholder && msg.id === placeholderId
            ? { role: "bot", content: response.answer }
            : msg,
        ),
      );
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to send message. Please try again.");

      // Remove placeholder message on error
      setMessages((prev) =>
        prev.filter((msg) => !(msg.isPlaceholder && msg.id === placeholderId)),
      );
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
    <div
      className="flex w-full bg-gray-50"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Sidebar with enhanced styling */}
      <aside className="w-72 bg-white border-r border-gray-200 shadow-sm overflow-y-auto transition-all duration-300">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h3 className="text-lg font-semibold text-white text-center">
            Chat Sessions
          </h3>
        </div>
        <div className="p-4">
          <button
            className="mb-4 w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            onClick={handleNewChat}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Chat
          </button>
          <ul className="space-y-2">
            {chatSessions.map((session) => (
              <li
                key={session.id}
                className={`flex justify-between items-center cursor-pointer p-3 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                  session.id === sessionId
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
                onClick={() => handleSessionClick(session)}
              >
                <span className="truncate font-medium text-gray-700">
                  {session.name || `Chat ${session.id.substring(0, 8)}`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                  title="Delete Session"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Chat Area with improved styling */}
      <div className="flex-1 flex flex-col bg-white">
        <h2 className="text-xl font-semibold text-center p-4 border-b border-gray-200 bg-white shadow-sm text-gray-800">
          Chat with Your Bot
        </h2>

        {/* Chat message container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-blue-50 to-indigo-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">
                Start a conversation by typing a message below
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  } ${msg.isPlaceholder ? "animate-pulse" : ""}`}
                >
                  {msg.isPlaceholder ? (
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "600ms" }}
                      ></div>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white ml-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-center p-3 border-t border-red-200">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Message input area */}
        <div className="p-4 border-t border-gray-200 bg-white shadow-md">
          <div className="flex items-end rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
            <textarea
              className="flex-1 p-3 bg-transparent border-none focus:outline-none resize-none max-h-32"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              style={{ minHeight: "50px" }}
            />
            <button
              className={`m-1 p-3 rounded-lg ${
                loading || !input.trim()
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-md"
              } transition-all duration-200`}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
