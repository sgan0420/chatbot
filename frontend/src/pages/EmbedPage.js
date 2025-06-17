import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const EmbedPage = () => {
  const { botId } = useParams();
  const [copied, setCopied] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "close-chat-widget") {
        setWidgetOpen(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const embedCode = `<iframe 
  src="https://chatbot-69x9.onrender.com/embed-chat/${botId}" 
  style="width: 100%; height: 500px; border: none;" 
  title="Chatbot">
</iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl shadow-lg bg-white mt-10">
      <h2 className="text-2xl font-bold mb-4">Embed Your Chatbot</h2>

      <p className="mb-2">Paste this code anywhere in your website:</p>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
        {embedCode}
      </pre>

      <button
        onClick={handleCopy}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-3"
      >
        {copied ? "Copied!" : "Copy Code"}
      </button>

      <hr className="my-6" />

      <button
        onClick={() => {
          setShowWidget(!showWidget);
          if (!showWidget) setWidgetOpen(false); // Reset widget state when closing preview
        }}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {showWidget ? "Hide Widget Preview" : "Try Widget Preview"}
      </button>

      {showWidget && (
        <>
          {/* Floating Chat Button */}
          <button
            onClick={() => setWidgetOpen(!widgetOpen)}
            className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
          >
            {widgetOpen ? "x" : "💬"}
          </button>

          {/* Floating Chat iframe (always created but toggled) */}
          <iframe
            src={`https://chatbot-69x9.onrender.com/embed-chat/${botId}`}
            className="fixed bottom-20 right-4 w-96 h-[600px] shadow-lg border border-gray-300 rounded-2xl overflow-hidden z-40"
            style={{
              border: "none",
              display: widgetOpen ? "block" : "none",
            }}
            title="Chatbot"
          />
        </>
      )}
    </div>
  );
};

export default EmbedPage;
