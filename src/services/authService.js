import axios from 'axios';

const API_URL = '/api/auth';

const authService = {
  login: async (credentials) => {
    // 1) Hacemos la petición de login
    const response = await axios.post(`${API_URL}/login`, credentials);
    // 2) Guardamos en localStorage SOLO si viene un objeto válido
    if (response.data && typeof response.data === 'object') {
      // Asumimos que tu API devuelve { user: {…}, token: '…' } o directamente el user
      const toStore = response.data.user ?? response.data;
      localStorage.setItem('user', JSON.stringify(toStore));
    }
    return response;
  },

  register: (userData) =>
    axios.post(`${API_URL}/register`, userData),

  forgotPassword: (email) =>
    axios.post(`${API_URL}/forgot-password`, { email }),

  resetPassword: (data) =>
    axios.put(`${API_URL}/reset-password`, data),

  // Nuevo método seguro para leer el usuario
  getCurrentUser: () => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn('authService: usuario corrupto en localStorage:', raw);
      localStorage.removeItem('user');
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
  }
};

export default authService;
