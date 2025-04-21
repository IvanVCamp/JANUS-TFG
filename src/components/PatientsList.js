import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/patientsList.css';

function PatientsList() {
  // Estados para gestionar la lista de pacientes, carga y el modal
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estados para los resultados de los juegos (consultados por backend)
  const [timeMachineResult, setTimeMachineResult] = useState(null);
  const [planetMapResult, setPlanetMapResult] = useState(null);
  const [emotionsDiaryResult, setEmotionsDiaryResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://localhost:8080/api/therapist/patients', {
          headers: { 'x-auth-token': token }
        });
        setPatients(response.data);
      } catch (error) {
        console.error('Error al obtener pacientes:', error.response ? error.response.data : error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Consulta el resultado de la Máquina del Tiempo para el paciente
  const fetchTimeMachineResult = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://localhost:8080/api/game?patientId=${patientId}`, {
        headers: { 'x-auth-token': token }
      });
      if (response.data && response.data.length > 0) {
        // Se toma el primer resultado (o el más reciente)
        setTimeMachineResult(response.data[0]);
      } else {
        setTimeMachineResult(null);
      }
    } catch (error) {
      console.error("Error al obtener el resultado de la Máquina del Tiempo:", error);
    }
  };

  // Consulta el registro de Mi Planeta para el paciente
  const fetchPlanetMapResult = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://localhost:8080/api/planet-map?patientId=${patientId}`, {
        headers: { 'x-auth-token': token }
      });
      if (response.data) {
        setPlanetMapResult(response.data);
      } else {
        setPlanetMapResult(null);
      }
    } catch (error) {
      console.error("Error al obtener el resultado de Mi Planeta:", error);
    }
  };

  // Consulta el Diario de Emociones para el paciente
  const fetchEmotionsDiaryResult = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://localhost:8080/api/emotions?patientId=${patientId}`, {
        headers: { 'x-auth-token': token }
      });
      if (response.data && response.data.length > 0) {
        // Se toma el primer resultado (o el más reciente)
        setEmotionsDiaryResult(response.data[0]);
      } else {
        setEmotionsDiaryResult(null);
      }
    } catch (error) {
      console.error("Error al obtener el resultado del Diario de Emociones:", error);
      setEmotionsDiaryResult(null);
    }
  };

  // Al abrir el modal se selecciona el paciente y se obtienen los resultados de juego
  const openModal = (patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
    // Reiniciamos resultados previos
    setTimeMachineResult(null);
    setPlanetMapResult(null);
    setEmotionsDiaryResult(null);
    // Consultamos los resultados para este paciente
    fetchTimeMachineResult(patient._id);
    fetchPlanetMapResult(patient._id);
    fetchEmotionsDiaryResult(patient._id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
    setTimeMachineResult(null);
    setPlanetMapResult(null);
    setEmotionsDiaryResult(null);
  };

  // Función para llevar a la pantalla del juego correspondiente
  const handleGameSession = (game, patientId) => {
    let path = '';
    switch (game) {
      case 'time-machine':
        path = '/time-machine-game';
        break;
      case 'emotions-diary':
        path = '/diario-de-emociones';
        break;
      case 'planet-map':
        path = '/mi-planeta';
        break;
      default:
        path = '/dashboard';
    }
    navigate(`${path}?patientId=${patientId}`);
  };

  return (
    <div className="therapist-patient-list">
      <h1>Listado de Pacientes</h1>
      {loading ? (
        <p>Cargando pacientes...</p>
      ) : (
        <table className="patient-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Fecha de Nacimiento</th>
              <th>Email</th>
              <th className="action-col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient._id}>
                <td>{patient.nombre} {patient.apellidos}</td>
                <td>{new Date(patient.fechaNacimiento).toLocaleDateString()}</td>
                <td>{patient.email}</td>
                <td className="action-col">
                  <button className="detail-btn" onClick={() => openModal(patient)}>
                    <i className="fa fa-search"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Perfil del Paciente</h2>
            <div className="profile-info">
              <p>
                <strong>Nombre:</strong> {selectedPatient.nombre} {selectedPatient.apellidos}
              </p>
              <p>
                <strong>Fecha de Nacimiento:</strong> {new Date(selectedPatient.fechaNacimiento).toLocaleDateString()}
              </p>
              <p>
                <strong>Email:</strong> {selectedPatient.email}
              </p>
            </div>
            <div className="games-info">
              <h3>Estado de Juegos</h3>
              <ul>
                <li>
                  <span>Máquina del Tiempo:</span>{" "}
                  {timeMachineResult ? "Completado" : "Pendiente"}
                  <button
                    className="game-detail-btn"
                    onClick={() => handleGameSession("time-machine", selectedPatient._id)}
                    title={timeMachineResult ? "Ir a la Máquina del Tiempo" : "Juego pendiente"}
                    disabled={!timeMachineResult}
                  >
                    <i className="fa fa-clock-o"></i>
                  </button>
                </li>
                <li>
                  <span>Diario de Emociones:</span>{" "}
                  {emotionsDiaryResult ? "Completado" : "Pendiente"}
                  <button
                    className="game-detail-btn"
                    onClick={() => handleGameSession("emotions-diary", selectedPatient._id)}
                    title={emotionsDiaryResult ? "Ir al Diario de Emociones" : "Juego pendiente"}
                    disabled={!emotionsDiaryResult}
                  >
                    <i className="fa fa-book"></i>
                  </button>
                </li>
                <li>
                  <span>Mi Planeta:</span>{" "}
                  {planetMapResult ? "Completado" : "Pendiente"}
                  <button
                    className="game-detail-btn"
                    onClick={() => handleGameSession("planet-map", selectedPatient._id)}
                    title={planetMapResult ? "Ir a Mi Planeta" : "Juego pendiente"}
                    disabled={!planetMapResult}
                  >
                    <i className="fa fa-globe"></i>
                  </button>
                </li>
              </ul>
            </div>
            <button className="close-modal-btn" onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsList;
