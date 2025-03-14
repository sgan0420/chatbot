import React from "react";
import { useParams } from "react-router-dom";

const EmbedPage = () => {
  const { botId } = useParams(); // Get bot ID from URL

  // Example embed code snippet
  const embedCode = `<script src="https://yourwebsite.com/chatbot.js" data-bot-id="${botId}"></script>`;

  return (
    <div className="embed-page">
      <h2>Embed Your Chatbot</h2>
      <p>Copy and paste this code snippet into your website:</p>
      <pre className="code-snippet">{embedCode}</pre>
      <button
        onClick={() => navigator.clipboard.writeText(embedCode)}
        className="copy-button"
      >
        Copy Code
      </button>
    </div>
  );
};

export default EmbedPage;
