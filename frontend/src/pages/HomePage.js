import React from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Gasy AI Assistant</h1>
          <p className="hero-subtitle">
            Your intelligent companion for seamless conversations and automated
            solutions
          </p>
          <div className="hero-buttons">
            <Link to="/login">
              <button className="primary-button">Get Started</button>
            </Link>
            <Link to="/dashboard">
              <button className="secondary-button">View Dashboard</button>
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="ai-assistant-graphic"></div>
        </div>
      </section>

      <section className="features-section">
        <h2>Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Conversations</h3>
            <p>
              Interact with state-of-the-art AI to get instant responses and
              information.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Detailed Analytics</h3>
            <p>
              Track your conversations and get insights about your interaction
              patterns.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Lightning Fast</h3>
            <p>
              Experience rapid response times and seamless processing of your
              requests.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Secure & Private</h3>
            <p>
              Your data is encrypted and protected with industry-standard
              security measures.
            </p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>
              Sign up to get access to all features and start your AI journey.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Start a Conversation</h3>
            <p>
              Ask questions, get information, or solve problems with the AI
              assistant.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Track Your Progress</h3>
            <p>
              View analytics and insights about your interactions on the
              dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p>
              "The AI assistant has revolutionized how I work. It's like having
              a personal assistant available 24/7."
            </p>
            <div className="testimonial-author">- Sarah J.</div>
          </div>
          <div className="testimonial-card">
            <p>
              "I'm impressed with how quickly it understands context and
              provides relevant responses. A game changer!"
            </p>
            <div className="testimonial-author">- Michael T.</div>
          </div>
          <div className="testimonial-card">
            <p>
              "The analytics dashboard gives me valuable insights into my
              conversation patterns and helps me be more productive."
            </p>
            <div className="testimonial-author">- Elena R.</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>
          Join thousands of users who are already enhancing their productivity
          with Gasy AI Assistant.
        </p>
        <Link to="/login">
          <button className="primary-button">Create Your Account</button>
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
