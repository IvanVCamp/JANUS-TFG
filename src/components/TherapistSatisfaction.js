// src/components/TherapistInterests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/patientsList.css'; // Reutilizamos el CSS de la tabla

export default function TherapistSatisfaction() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasDiary, setHasDiary] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/therapist/patients', {
          headers: { 'x-auth-token': token }
        });
        setPatients(data);

        // Comprobar para cada paciente si tiene al menos un diario
        const diaryChecks = await Promise.all(data.map(async p => {
          const resp = await axios.get(`/api/emotions?patientId=${p._id}`, {
            headers: { 'x-auth-token': token }
          });
          return [p._id, resp.data && resp.data.length > 0];
        }));
        setHasDiary(Object.fromEntries(diaryChecks));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <p>Cargando pacientes…</p>;

  return (
    <div className="therapist-patient-list">
      <h1>Pacientes - Intereses Emocionales</h1>
      <table className="patient-table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Fecha de Nacimiento</th>
            <th>Email</th>
            <th className="action-col">Estadísticas</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr key={p._id}>
              <td>{p.nombre} {p.apellidos}</td>
              <td>{new Date(p.fechaNacimiento).toLocaleDateString()}</td>
              <td>{p.email}</td>
              <td className="action-col">
                <button
                  className="detail-btn"
                  disabled={!hasDiary[p._id]}
                  onClick={() => navigate(`/therapist/interests/${p._id}`)}
                  title={hasDiary[p._id]
                    ? "Ver estadísticas de emociones"
                    : "Diario de emociones pendiente"}
                >
                  <i className="fa fa-smile-o"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
