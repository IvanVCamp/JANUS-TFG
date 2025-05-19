import React, { useState, useEffect } from 'react';
import axios                      from 'axios';
import { Link }                   from 'react-router-dom';
import '../styles/patientsList.css';
import '../Styles/therapistSessionNotes.css';

export default function TherapistSessionNotes() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/therapist/patients', {
        headers: { 'x-auth-token': token }
      });
      setPatients(data);
      setLoading(false);
    };
    fetchPatients();
  }, []);

  if (loading) return <p>Cargando pacientes…</p>;

  return (
    <div className="therapist-session-notes-list">
      <h1>Selecciona Paciente para Notas</h1>
      <div className="patients-grid">
        {patients.map(p => (
          <Link
            key={p._id}
            to={`/therapist/session-notes/${p._id}`}
            className="patient-note-card"
          >
            <h3>{p.nombre} {p.apellidos}</h3>
            <small>{new Date(p.fechaNacimiento).toLocaleDateString()}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
