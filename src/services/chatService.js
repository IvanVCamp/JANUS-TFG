import axios from 'axios';

// Ajusta la URL base según tu backend
const API_URL = 'http://localhost:5000/api';

const chatService = {
  // Obtiene la lista de chats iniciados
  getChats: async () => {
    const response = await axios.get(`${API_URL}/chats`);
    return response.data; // Debe ser un array de chats
  },

  // Inicia un nuevo chat con un usuario (p.ej. userId)
  startChat: async (userId) => {
    const response = await axios.post(`${API_URL}/chats`, { userId });
    return response.data; // Devuelve el chat recién creado
  },

  // Obtiene los mensajes de un chat
  getMessages: async (chatId) => {
    const response = await axios.get(`${API_URL}/chats/${chatId}/messages`);
    return response.data; // Array de mensajes
  },

  // Envía un mensaje (texto + archivo opcional)
  sendMessage: async (chatId, formData) => {
    // formData debería incluir { text, file, etc. }
    const response = await axios.post(`${API_URL}/chats/${chatId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data; // Mensaje creado
  },

  // Buscar usuarios por nombre o email para iniciar conversación
  searchUsers: async (query) => {
    const response = await axios.get(`${API_URL}/users/search`, {
      params: { q: query }
    });
    return response.data; // Array de usuarios encontrados
  }
};

export default chatService;
