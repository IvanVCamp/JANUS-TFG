// src/components/AssignTemplate.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/routineTemplates.css';

export default function AssignTemplate() {
  const { templateId } = useParams();
  const [tpl, setTpl] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`/api/routines/templates/${templateId}`, { headers: {'x-auth-token':token} })
      .then(r=> setTpl(r.data));
    axios.get(`/api/therapist/patients`, { headers: {'x-auth-token':token} })
      .then(r=> setPatients(r.data));
  }, [templateId]);

  const handleAssign = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/routines/instances',
        { templateId, patientId: selected },
        { headers:{ 'x-auth-token': token } }
      );
      setMsg('Asignación realizada con éxito');
      setTimeout(() => nav('/therapist/templates'), 1000);
    } catch {
      setMsg('Error al asignar la plantilla');
    }
  };

  if (!tpl) return <p>Cargando plantilla…</p>;

  return (
    <div className="routine-templates-page">
    <div className="assign-form">
      <h2>Asignar: {tpl.name}</h2>
      <label>Paciente</label>
      <select value={selected} onChange={e=>setSelected(e.target.value)}>
        <option value="">--Selecciona--</option>
        {patients.map(p => (
          <option key={p._id} value={p._id}>
            {p.nombre} {p.apellidos}
          </option>
        ))}
      </select>

      <button
        className="btn-save"
        onClick={handleAssign}
        disabled={!selected}
      >
        Confirmar Asignación
      </button>
      {msg && <p className="assign-msg">{msg}</p>}
    </div>
    </div>
  );
}
