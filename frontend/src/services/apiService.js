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

// TODO: implement createChatbot function
export const createChatbot = async (botData) => {
  try {
    const response = await api.post("/chatbot/create", botData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// New: implement updateChatbot function to update bot name and description
export const updateChatbot = async (id, botData) => {
  try {
    const response = await api.put(`/chatbot/${id}`, botData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ========== CHAT API CALLS ==========
export const chat = async (data) => {
  try {
    const response = await api.post("/chat", data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChatHistory = async ({ chatbot_id, session_id }) => {
  try {
    const response = await api.get("/chat/get-history", {
      params: { chatbot_id, session_id },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createChatSession = async (chatbot_id) => {
  try {
    const response = await api.post("/chat/create-session", { chatbot_id });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteChatSession = async (session_id, chatbot_id) => {
  try {
    const response = await api.delete(`/chat/delete-session/${session_id}`, {
      params: { chatbot_id },
    });
    return response.data.data; // Assumes API returns data.error or success data.
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChatSessions = async (chatbot_id) => {
  try {
    const response = await api.get(`/chat/get-sessions/${chatbot_id}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== DOCUMENT API CALLS ==========

// Upload a document for a chatbot
export const uploadDocument = async (chatbotId, file) => {
  try {
    const formData = new FormData();
    formData.append("chatbot_id", chatbotId);
    formData.append("file", file);

    const response = await api.post("/chatbot/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
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

export const processDocument = async (chatbot_id) => {
  try {
    const response = await api.post(`/rag/process`, { chatbot_id });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
