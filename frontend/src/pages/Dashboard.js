import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();

  const [botsCount, setBotsCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [botStats, setBotStats] = useState({
    totalMessages: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Mock fetching data
    setBotsCount(3);
    setCurrentPlan("Pro");
    setBotStats({
      totalMessages: 1200,
      activeUsers: 45,
    });
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Summary Cards */}
      <div className="dashboard-summary">
        <div className="card">
          <h3>Total Bots</h3>
          <p>{botsCount}</p>
        </div>
        <div className="card">
          <h3>Current Plan</h3>
          <p>{currentPlan}</p>
        </div>
        <div className="card">
          <h3>Total Messages</h3>
          <p>{botStats.totalMessages}</p>
        </div>
        <div className="card">
          <h3>Active Users</h3>
          <p>{botStats.activeUsers}</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="dashboard-buttons">
        <button className="view-bots" onClick={() => navigate("/bots")}>
          View Bots
        </button>
        <button className="new-bot" onClick={() => navigate("/create-bot")}>
          New Bot
        </button>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Bot Activity</h2>
        <ul>
          <li>ChatBot Alpha handled 50 queries today</li>
          <li>ChatBot Beta had 10 new users</li>
          <li>ChatBot Gamma received 200 messages this week</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardPage;
