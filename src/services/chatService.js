// services/chatService.js
import axios from 'axios';

const API_URL = 'https://localhost:8080/api';

const chatService = {
  getChats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chats`, {
      headers: { 'x-auth-token': token },
    });
    return response.data;
  },

  startChat: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chats`,
      { userId },
      { headers: { 'x-auth-token': token } }
    );
    return response.data;
  },

  getMessages: async (chatId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
      headers: { 'x-auth-token': token },
    });
    return response.data;
  },

  sendMessage: async (chatId, formData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chats/${chatId}/messages`,
      formData,
      {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  searchUsers: async (query) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/search`, {
      params: { q: query },
      headers: { 'x-auth-token': token },
    });
    return response.data;
  },
};

export default chatService;
