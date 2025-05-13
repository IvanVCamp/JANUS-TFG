import axios from 'axios';
const API = '/api/routines';

export const createTemplate       = data => axios.post(`${API}/templates`, data);
export const fetchTemplates       = ()   => axios.get(`${API}/templates`);
export const updateTemplate       = (id, data) => axios.put(`${API}/templates/${id}`, data);
export const deleteTemplate       = id   => axios.delete(`${API}/templates/${id}`);

export const assignRoutine        = data => axios.post(`${API}/instances`, data);
export const fetchInstances       = patientId => axios.get(`${API}/instances/patient/${patientId}`);
export const updateInstanceStatus = (id, data) => axios.put(`${API}/instances/${id}/status`, data);

export default routineTemplateService;