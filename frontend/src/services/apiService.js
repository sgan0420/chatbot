import api from "./api"; // Import the Axios instance

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

export const uploadFile = async (formData) => {
  return await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
