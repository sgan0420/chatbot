import React, { useState, useEffect, useRef } from "react";
import {
  publicChat,
  getChatHistory,
  publicCreateSession,
} from "../services/apiService";

const ChatConversation = ({ chatbot_id, showHeader = false }) => {
  const messagesEndRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Minimal change: Use a ref to guard session creation
  const sessionCreated = useRef(false);

  useEffect(() => {
    const createSession = async () => {
      const res = await publicCreateSession(chatbot_id);
      setSessionId(res.session_id);
    };
    if (!sessionCreated.current) {
      sessionCreated.current = true;
      createSession();
    }
  }, [chatbot_id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };
    const originalInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

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

    setLoading(true);

    try {
      const response = await publicChat({
        chatbot_id,
        session_id: sessionId,
        query: originalInput,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.isPlaceholder && msg.id === placeholderId
            ? { role: "bot", content: response.data.answer }
            : msg,
        ),
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.filter((msg) => !(msg.isPlaceholder && msg.id === placeholderId)),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showHeader && (
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">Chat with the Chatbot</span>
          <button
            onClick={() => window.parent.postMessage("close-chat-widget", "*")}
            className="text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-3 py-2 rounded ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.isPlaceholder ? (
                <div className="flex items-center space-x-1">
                  <div
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-2 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatConversation;
