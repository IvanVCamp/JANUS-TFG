import axios from 'axios';
const API = '/api/assigned-routines';

export default {
  assign: (data, token) =>
    axios.post(API, data, { headers: { 'x-auth-token': token } }),

  getList: (paramsOrToken, maybeToken) => {
    if (maybeToken) {
      // llamada con params y token
      return axios.get(API, {
        params: paramsOrToken,
        headers: { 'x-auth-token': maybeToken }
      });
    } else {
      // llamada solo con token
      return axios.get(API, {
        headers: { 'x-auth-token': paramsOrToken }
      });
    }
  },

  update: (id, data, token) =>
    axios.put(`${API}/${id}`, data, { headers: { 'x-auth-token': token } })
};
