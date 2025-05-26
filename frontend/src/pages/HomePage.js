import React from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Create Custom AI Chatbots in Minutes</h1>
          <p className="hero-subtitle">
            Build, train with your data, and embed intelligent chatbots on your
            website - no coding required
          </p>
          <div className="hero-buttons">
            <Link to="/login">
              <button className="primary-button">Create Your Chatbot</button>
            </Link>
            <Link to="/dashboard">
              <button className="secondary-button">View Your Bots</button>
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="ai-chatbot-graphic"></div>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Gasy Chatbot Builder</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Easy Chatbot Creation</h3>
            <p>
              Create a custom AI chatbot in minutes with our intuitive interface
              - no technical skills needed.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Train with Your Content</h3>
            <p>
              Upload PDFs, CSVs, text files and more to build a knowledge base
              for your chatbot.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔌</div>
            <h3>Simple Website Integration</h3>
            <p>
              Embed your trained chatbot on any website with a simple copy-paste
              code snippet.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Conversation Analytics</h3>
            <p>
              Track how users interact with your chatbot and optimize based on
              real conversations.
            </p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Your Bot</h3>
            <p>
              Sign up and create a new chatbot with your desired name and
              appearance.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Upload Knowledge</h3>
            <p>
              Upload PDFs, documents, FAQs and other files to train your
              chatbot.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Embed on Website</h3>
            <p>
              Copy your unique code snippet and paste it into your website's
              HTML.
            </p>
          </div>
        </div>
      </section>

      <section className="upload-showcase">
        <h2>Upload Virtually Any Content</h2>
        <p className="showcase-description">
          Our platform supports a wide range of file formats to build your
          chatbot's knowledge base
        </p>

        <div className="file-types-grid">
          <div className="file-type-card">
            <div className="file-icon">📄</div>
            <h3>PDF Documents</h3>
            <p>User manuals, guides, reports</p>
          </div>
          <div className="file-type-card">
            <div className="file-icon">📊</div>
            <h3>CSV Spreadsheets</h3>
            <p>Product catalogs, data sheets</p>
          </div>
          <div className="file-type-card">
            <div className="file-icon">📝</div>
            <h3>Text Files</h3>
            <p>FAQs, instructions, policies</p>
          </div>
          <div className="file-type-card">
            <div className="file-icon">🔗</div>
            <h3>Web URLs</h3>
            <p>Website content, online resources</p>
          </div>
          <div className="file-type-card">
            <div className="file-icon">📚</div>
            <h3>Q&A Pairs</h3>
            <p>Pre-defined question/answers</p>
          </div>
          <div className="file-type-card">
            <div className="file-icon">📋</div>
            <h3>JSON/JSONL</h3>
            <p>Structured data formats</p>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <p>
              "I created a support chatbot for my e-commerce site in under an
              hour. It's handling 70% of customer questions automatically now!"
            </p>
            <div className="testimonial-author">
              - Sarah J., E-commerce Owner
            </div>
          </div>
          <div className="testimonial-card">
            <p>
              "We uploaded our entire knowledge base and product documentation.
              Our support team can now focus on complex issues while the bot
              handles the rest."
            </p>
            <div className="testimonial-author">
              - Michael T., Product Manager
            </div>
          </div>
          <div className="testimonial-card">
            <p>
              "The ability to train the bot with our own content makes it feel
              like a true extension of our brand and voice. Our customers love
              it!"
            </p>
            <div className="testimonial-author">
              - Elena R., Marketing Director
            </div>
          </div>
        </div>
      </section>

      <section className="embed-showcase">
        <h2>Embed Anywhere</h2>
        <div className="embed-content">
          <div className="embed-image">
            <div className="website-mockup"></div>
          </div>
          <div className="embed-description">
            <h3>Simple Integration</h3>
            <p>
              Add your chatbot to any website with a simple code snippet.
              Customize the appearance to match your brand.
            </p>
            <div className="code-snippet">
              <code>
                &lt;iframe src="http://localhost:3000/embed-chat/botId"&gt;
                &lt;/iframe&gt;
              </code>
            </div>
            <ul className="embed-benefits">
              <li>Works on any website platform</li>
              <li>Responsive design for mobile and desktop</li>
              <li>Customizable colors and positioning</li>
              <li>No impact on website performance</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Build Your AI Chatbot?</h2>
        <p>
          Create a chatbot trained on your own content and embedded on your
          website in minutes.
        </p>
        <Link to="/login">
          <button className="primary-button">Get Started for Free</button>
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
