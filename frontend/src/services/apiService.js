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
export const getChatbots = async () => {
  try {
    const response = await api.get("/chatbots");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch a single chatbot by ID
export const getChatbotById = async (id) => {
  try {
    const response = await api.get(`/chatbots/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to create a new chatbot
export const createChatbot = async (botData) => {
  try {
    const response = await api.post("/chatbots", botData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating chatbot:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Delete a chatbot
export const deleteChatbot = async (id) => {
  try {
    await api.delete(`/chatbots/${id}`);
  } catch (error) {
    throw error;
  }
};

// Upload a file
export const uploadFile = async (formData) => {
  return await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
