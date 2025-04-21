// services/taskService.js
import axios from 'axios';

const API_URL = '/api/tasks';

const taskService = {
  getTasks: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  },

  createTask: async (taskData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, taskData, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  },

  updateTask: async (taskId, updatedFields) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/${taskId}`, updatedFields, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  },

  deleteTask: async (taskId) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/${taskId}`, {
      headers: { 'x-auth-token': token }
    });
    return response.data;
  }
};

export default taskService;
