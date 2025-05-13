import React, { useEffect, useState } from 'react';
import routineService from '../services/routineTemplateService';
import '../styles/routineTemplates.css';

export default function PatientAssignedRoutines() {
  const [assigns, setAssigns] = useState([]);

  useEffect(() => {
    routineService.getAssignments()
      .then(res => setAssigns(res.data))
      .catch(console.error);
  }, []);

  const updateStatus = async (id, status) => {
    await routineService.updateAssign(id, { status });
    setAssigns(a=>a.map(x=> x._id===id ? {...x, status} : x ));
  };

  return (
    <div className="routine-templates-page">
    <div className="patient-assigns">
      <h1>Mis Rutinas</h1>
      {assigns.map(a => (
        <div key={a._id} className={`assign-card status-${a.status}`}>
          <h3>{a.template.title}</h3>
          <p>{a.template.description}</p>
          <small>{a.template.type} · {a.template.duration} min</small>
          <div className="assign-actions">
            {a.status==='pending' && (
              <>
                <button onClick={()=>updateStatus(a._id,'completed')} className="btn-complete">Completar</button>
                <button onClick={()=>updateStatus(a._id,'postponed')} className="btn-postpone">Posponer</button>
              </>
            )}
            {a.status!=='pending' && (
              <span>Estado: <strong>{a.status}</strong></span>
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
