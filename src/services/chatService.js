// services/chatService.js
import axios from 'axios';

// Ajusta la URL base según tu backend
const API_URL = 'http://localhost:5000/api';

const chatService = {
  // Obtiene la lista de chats iniciados
  getChats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chats`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.data; // Debe ser un array de chats
  },

  // Inicia un nuevo chat con un usuario (p.ej. userId)
  startChat: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chats`,
      { userId },
      {
        headers: {
          'x-auth-token': token,
        },
      }
    );
    return response.data; // Devuelve el chat recién creado
  },

  // Obtiene los mensajes de un chat
  getMessages: async (chatId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
      headers: {
        'x-auth-token': token,
      },
    });
    return response.data; // Array de mensajes
  },

  // Envía un mensaje (texto + archivo opcional)
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
    return response.data; // Mensaje creado
  },

  // Buscar usuarios por nombre/apellidos/email
  searchUsers: async (query) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/search`, {
      params: { q: query },
      headers: {
        'x-auth-token': token,
      },
    });
    return response.data; // Array de usuarios encontrados
  },
};

export default chatService;
