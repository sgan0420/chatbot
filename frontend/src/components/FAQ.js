import React, { useState } from "react";
import "../styles/FAQ.css";

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "What is Gasy AI?",
      answer:
        "Gasy AI is a conversational AI platform that allows businesses to create and deploy custom chatbots to enhance customer interaction and automate support services.",
    },
    {
      question: "How do I create a new bot?",
      answer:
        "You can create a new bot by navigating to the Bots section from the dashboard, clicking on 'Create New Bot', and following the setup wizard to configure your bot's capabilities.",
    },
    {
      question: "Can I customize my chatbot's appearance?",
      answer:
        "Yes, Gasy AI offers extensive customization options including colors, fonts, and interface elements to match your brand's identity and website design.",
    },
    {
      question: "What platforms can I deploy my chatbot on?",
      answer:
        "Gasy AI bots can be deployed on websites, mobile apps, and popular messaging platforms like Facebook Messenger, WhatsApp, and Telegram.",
    },
    {
      question: "Do I need coding skills to use Gasy AI?",
      answer:
        "No, our platform is designed to be user-friendly with a no-code interface, allowing anyone to create sophisticated chatbots without programming knowledge.",
    },
    {
      question: "How does pricing work?",
      answer:
        "Gasy AI offers tiered pricing plans based on the number of messages processed, bot features, and level of support. Check our pricing page for detailed information.",
    },
    {
      question: "Can my chatbot handle multiple languages?",
      answer:
        "Yes, Gasy AI supports multilingual capabilities, allowing your chatbot to communicate with users in various languages.",
    },
    {
      question: "How can I train my chatbot to better understand user queries?",
      answer:
        "You can train your chatbot through our intuitive training interface by adding example phrases, creating custom intents, and reviewing conversation logs to identify improvement areas.",
    },
  ];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>
          Find answers to common questions about Gasy AI and our chatbot
          platform.
        </p>
      </div>

      <div className="faq-content">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? "active" : ""}`}
          >
            <div
              className="faq-question"
              onClick={() => toggleAccordion(index)}
            >
              <h3>{item.question}</h3>
              <span className="faq-icon">
                {activeIndex === index ? "−" : "+"}
              </span>
            </div>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="faq-contact">
        <h2>Still have questions?</h2>
        <p>
          If you couldn't find the answer you were looking for, please contact
          our support team.
        </p>
        <button className="contact-button">Contact Support</button>
      </div>
    </div>
  );
}

export default FAQ;
