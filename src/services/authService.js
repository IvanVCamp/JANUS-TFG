import axios from 'axios';

const API_URL = '/api/auth';

const authService = {
  login: (credentials) => axios.post(`${API_URL}/login`, credentials),
  register: (userData) => axios.post(`${API_URL}/register`, userData),
  forgotPassword: (email) => axios.post(`${API_URL}/forgot-password`, { email }),
  resetPassword: (data) => axios.put(`${API_URL}/reset-password`, data)
};

export default authService;
