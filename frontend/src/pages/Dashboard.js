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
        <button
          className="new-bot"
          style={{ background: "linear-gradient(to right, #6a11cb, #2575fc)" }}
          onClick={() => navigate("/create-bot")}
        >
          New Bot
        </button>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Bot Activity</h2>
        <div className="activity-cards">
          <div className="activity-card">
            <div className="activity-icon">
              <span role="img" aria-label="messages">
                💬
              </span>
            </div>
            <div className="activity-content">
              <h4>ChatBot Alpha</h4>
              <p>Handled 50 queries today</p>
              <span className="activity-time">Today</span>
            </div>
          </div>
          <div className="activity-card">
            <div className="activity-icon">
              <span role="img" aria-label="users">
                👥
              </span>
            </div>
            <div className="activity-content">
              <h4>ChatBot Beta</h4>
              <p>Gained 10 new users</p>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>
          <div className="activity-card">
            <div className="activity-icon">
              <span role="img" aria-label="stats">
                📊
              </span>
            </div>
            <div className="activity-content">
              <h4>ChatBot Gamma</h4>
              <p>Received 200 messages</p>
              <span className="activity-time">This week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
