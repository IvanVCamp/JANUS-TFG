// src/services/routineService.js
import axios from 'axios';

const API_URL = '/api/game';

const routineService = {
  getGameResults: async (patientId, fromDate, toDate) => {
    const token = localStorage.getItem('token');
    const params = {};
    if (patientId) params.patientId = patientId;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    const response = await axios.get(API_URL, {
      params,
      headers: { 'x-auth-token': token }
    });
    return response.data;
  }
};

export default routineService;
