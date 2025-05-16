// src/services/assignedRoutineService.js
import axios from 'axios';

const API = '/api/routines/instances';

const assignedRoutineService = {
  /**
   * Obtiene todas las plantillas asignadas al paciente.
   * @param {string} patientId – ID del paciente
   */
  getAssignedTemplates: (patientId) =>
    axios.get(`${API}/${patientId}`),

  /**
   * Marca o desmarca una actividad en una instancia de rutina.
   * @param {string} instanceId – ID de la instancia
   * @param {number} activityIdx – índice de la actividad
   * @param {boolean} completed – true para marcar, false para desmarcar
   */
  toggleActivity: (instanceId, activityIdx, completed) =>
    axios.post(
      `${API}/${instanceId}/activities/${activityIdx}`,
      { completed }
    )
};

export default assignedRoutineService;
