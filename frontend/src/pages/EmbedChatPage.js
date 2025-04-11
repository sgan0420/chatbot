import React from "react";
import { useParams } from "react-router-dom";
import ChatConversation from "../components/ChatConversation";

const EmbedChatPage = () => {
  const { botId } = useParams();

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#f9fafb", // subtle background
      }}
    >
      <ChatConversation chatbot_id={botId} showHeader={true} />
    </div>
  );
};

export default EmbedChatPage;
