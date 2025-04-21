// src/components/TherapistRoutines.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/patientsList.css'; // reutiliza el CSS existente

function TherapistRoutines() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/therapist/patients', {
          headers: { 'x-auth-token': token }
        });
        setPatients(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const openRoutines = (patientId) => {
    navigate(`/therapist/routines/${patientId}`);
  };

  return (
    <div className="therapist-patient-list">
      <h1>Pacientes - Equilibrio Ocupacional</h1>
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
            {patients.map(p => (
              <tr key={p._id}>
                <td>{p.nombre} {p.apellidos}</td>
                <td>{new Date(p.fechaNacimiento).toLocaleDateString()}</td>
                <td>{p.email}</td>
                <td className="action-col">
                  <button className="detail-btn" onClick={() => openRoutines(p._id)}>
                    <i className="fa fa-bar-chart"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TherapistRoutines;
