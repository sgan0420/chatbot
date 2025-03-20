import api from "./api"; // Import the Axios instance

// ========== AUTHENTICATION API CALLS ==========

// Sign up a new user
export const signupUser = async (email, password, display_name) => {
  try {
    const response = await api.post("/auth/signup", {
      email,
      password,
      display_name,
    });

    return {
      user: response.data.data.user,
      accessToken: response.data.data.session.access_token, // Extract session token
    };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Log in an existing user
export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    return {
      user: response.data.data.user,
      accessToken: response.data.data.session.access_token,
    };
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// User Logout
export const logout = () => {
  localStorage.removeItem("token");
  delete api.defaults.headers.Authorization;
};

// ========== CHATBOT API CALLS ==========

// Fetch all chatbots
export const getUserChatbots = async () => {
  try {
    const response = await api.get("/chatbot");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getChatbot = async (id) => {
  try {
    const response = await api.get(`/chatbot/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// TODO: implement getChatbotDetail function
export const getChatbotDetail = async (id) => {};

// TODO: implement createChatbot function
export const createChatbot = async (botData) => {};

// ========== DOCUMENT API CALLS ==========

// Upload a document for a chatbot
export const uploadDocument = async (chatbotId, formData) => {
  try {
    const response = await api.post(`/chatbot/upload/${chatbotId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// List documents for a chatbot
export const listDocuments = async (chatbotId) => {
  try {
    const response = await api.get(`/chatbot/list/${chatbotId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (payload) => {
  try {
    const response = await api.delete(`/chatbot/delete`, { data: payload });
    return response.data;
  } catch (error) {
    throw error;
  }
};
