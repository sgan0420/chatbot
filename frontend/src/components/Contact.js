import React, { useState } from "react";
import "../styles/Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send the form data to your backend
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    // Reset submitted state after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  const teamMembers = [
    {
      name: "Alicia Tiopan",
      role: "Data Analyst",
      email: "alicia.tiopan@gasyai.com",
      phone: "+1 (234) 567-8901",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Shijie Gan",
      role: "Project Manager",
      email: "shijie.gan@gasyai.com",
      phone: "+1 (345) 678-9012",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Samuel Leong",
      role: "UI/UX Designer",
      email: "samuel.leong@gasyai.com",
      phone: "+1 (456) 789-0123",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
    },
    {
      name: "Yang Dan",
      role: "Back End Engineer",
      email: "yang.dan@gasyai.com",
      phone: "+1 (567) 890-1234",
      image: "https://randomuser.me/api/portraits/women/23.jpg",
    },
  ];

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Get in touch with our team for any questions or inquiries</p>
      </div>

      <div className="contact-info">
        <div className="contact-details">
          <h2>Contact Information</h2>
          <div className="contact-item">
            <i className="contact-icon">📍</i>
            <p>123 AI Boulevard, San Francisco, CA 94105</p>
          </div>
          <div className="contact-item">
            <i className="contact-icon">📞</i>
            <p>+1 (800) GASY-BOT</p>
          </div>
          <div className="contact-item">
            <i className="contact-icon">✉️</i>
            <p>info@gasyai.com</p>
          </div>
          <div className="contact-hours">
            <h3>Business Hours</h3>
            <p>Monday - Friday: 9AM - 5PM PST</p>
            <p>Saturday - Sunday: Closed</p>
          </div>
        </div>

        <div className="contact-form-container">
          <h2>Send us a message</h2>
          {submitted ? (
            <div className="form-success">
              <p>Thank you for your message! We'll get back to you shortly.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button type="submit" className="submit-button">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-member">
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <p className="member-role">{member.role}</p>
              <div className="member-contact">
                <p>
                  <i className="member-icon">✉️</i> {member.email}
                </p>
                <p>
                  <i className="member-icon">📞</i> {member.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;
