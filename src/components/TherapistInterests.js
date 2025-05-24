// src/components/TherapistInterests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/patientsList.css';

export default function TherapistInterests() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [hasMap, setHasMap]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/therapist/patients', {
          headers: { 'x-auth-token': token }
        });
        setPatients(data);

        // Comprobar si cada paciente tiene un PlanetMap guardado
        const checks = await Promise.all(
          data.map(async p => {
            const resp = await axios.get(`/api/planet-map?patientId=${p._id}`, {
              headers: { 'x-auth-token': token }
            });
            const exists = resp.data && resp.data.elements && resp.data.elements.length > 0;
            return [p._id, exists];
          })
        );
        setHasMap(Object.fromEntries(checks));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <p>Cargando pacientes…</p>;

  // Solo pacientes que completaron MiPlaneta
  const filtered = patients.filter(p => hasMap[p._id]);

  return (
    <div className="therapist-patient-list">
      <div className="patients-header">
        <Link to="/therapist" className="back-link">← Volver</Link>
        <h1>Pacientes – Intereses por Planet Map</h1>
      </div>

      {filtered.length === 0 ? (
        <p>No hay pacientes con Planet Map completado.</p>
      ) : (
          <table className="patient-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Fecha de Nacimiento</th>
                <th>Email</th>
                <th className="action-col">Ver Estadísticas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id}>
                  <td>{p.nombre} {p.apellidos}</td>
                  <td>{new Date(p.fechaNacimiento).toLocaleDateString()}</td>
                  <td>{p.email}</td>
                  <td className="action-col">
                    <button
                      className="detail-btn"
                      onClick={() => navigate(`/therapist/interests/${p._id}`)}
                      title="Ver estadísticas de Planet Map"
                    >
                      <i className="fa fa-globe"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );
}
