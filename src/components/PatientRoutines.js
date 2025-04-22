import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar,
  ResponsiveContainer
} from 'recharts';
import '../styles/therapistRoutines.css';

// Mapeo de actividad a categoría
const categoryMap = {
  futbol: 'Ocio', dibujos: 'Ocio', comics: 'Ocio', videojuego: 'Ocio',
  tarea: 'Obligaciones', experimentos: 'Obligaciones',
  parque: 'Ocio', banio: 'Autocuidado', dormir: 'Autocuidado',
  musica: 'Ocio', bailar: 'Ocio', amigos: 'Ocio',
  bicicleta: 'Ocio', dibujar: 'Ocio', mascotas: 'Ocio',
  helado: 'Ocio', cantar: 'Ocio', lego: 'Ocio', nadar: 'Autocuidado',
  computadora: 'Ocio'
};
// Grupos para el radar
const groupMap = {
  Autocuidado: 'Autocuidado',
  Obligaciones: 'Obligaciones',
  Ocio: 'Ocio'
};
// Colores
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

function PatientRoutines() {
  const { patientId } = useParams();
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Carga de datos
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`/api/game?patientId=${patientId}`, {
      headers: { 'x-auth-token': token }
    }).then(resp => {
      const data = resp.data;
      setResults(data);
      // filtro inicial: últimos 7 días
      const now = new Date(), weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      setFrom(weekAgo.toISOString().slice(0,10));
      setTo(now.toISOString().slice(0,10));
    }).catch(console.error);
  }, [patientId]);

  // Filtrado por fecha
  useEffect(() => {
    if (!from || !to) return;
    const fDate = new Date(from), tDate = new Date(to);
    tDate.setHours(23,59,59,999);
    setFiltered(results.filter(r=>{
      const d = new Date(r.createdAt);
      return d >= fDate && d <= tDate;
    }));
  }, [results, from, to]);

  // Selección del primer día filtrado
  useEffect(() => {
    if (filtered.length) setSelected(filtered[0].createdAt);
    else setSelected(null);
  }, [filtered]);

  // Cálculo de métricas
  useEffect(() => {
    if (!selected) return;
    const res = filtered.find(r => r.createdAt === selected);
    setMetrics(res ? computeMetrics(res) : null);
  }, [selected]);

  function computeMetrics(result) {
    const slots = result.timeSlots || [];
    const activities = slots.flatMap(s =>
      (s.activities||[]).map(a=>({ ...a, slot: s.slot }))
    );
    const totalMin = activities.reduce((sum,a)=>sum+a.duration,0);
    // 1) Distribución %
    const catSum = {};
    activities.forEach(a=>{
      const cat = categoryMap[a.activityId] || 'Otros';
      catSum[cat] = (catSum[cat]||0) + a.duration;
    });
    const distribution = Object.entries(catSum)
      .map(([name,val])=>({ name, value: +(val/totalMin*100).toFixed(1) }));
    // 2) Horas por categoría
    const hours = Object.entries(catSum)
      .map(([name,val])=>({ name, hours: +(val/60).toFixed(2) }));
    // 3) Diversidad
    const diversity = new Set(activities.map(a=>a.activityId)).size;
    // 4) Consistencia (slots con >0 actividades)
    const covered = slots.filter(s=>s.activities?.length>0).length;
    const consistency = +((covered/24*100).toFixed(1));
    // 5) Balance Autocuidado/Obligaciones/Ocio
    const grpSum = { Autocuidado:0, Obligaciones:0, Ocio:0 };
    activities.forEach(a=>{
      const c = categoryMap[a.activityId] || 'Ocio';
      grpSum[groupMap[c]] += a.duration;
    });
    const groupBalance = Object.entries(grpSum)
      .map(([subject,val])=>({ subject, value: +(val/totalMin*100).toFixed(1) }));
    // 6) Gauge activo/reposo
    const active = grpSum.Obligaciones + grpSum.Ocio;
    const rest = grpSum.Autocuidado;
    // 7) Hourly occupancy
    const hourSum = {};
    activities.forEach(a=>{
      const h = parseInt(a.slot.split(':')[0],10);
      hourSum[h] = (hourSum[h]||0) + a.duration;
    });
    const hourly = Array.from({length:24},(_,i)=>({
      hour: `${String(i).padStart(2,'0')}:00`,
      minutes: hourSum[i]||0
    }));
    // 8) Objetivos (ejemplo hardcode)
    const objectives = [
      { subject:'Autocuidado', targetMin:60, actual: grpSum.Autocuidado },
      { subject:'Obligaciones', targetMin:120, actual: grpSum.Obligaciones, max:240 },
      { subject:'Ocio', targetMin:90, actual: grpSum.Ocio }
    ].map(o=>({
      ...o,
      compliant: o.actual >= (o.targetMin||0) && (o.max? o.actual<=o.max : true)
    }));

    return { distribution, hours, diversity, consistency, groupBalance, active, rest, hourly, objectives };
  }

  return (
    <div className="routines-container">
      <header className="routines-header">
        <Link to="/therapist/routines">← Volver</Link>
        <h2>Estadísticas de Rutinas</h2>
      </header>

      <section className="filter-section">
        <label>Desde: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>Hasta: <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <label>Seleccionar día:
          <select value={selected||''} onChange={e=>setSelected(e.target.value)}>
            {filtered.map(r => {
              const d = new Date(r.createdAt).toLocaleDateString();
              return <option key={r.createdAt} value={r.createdAt}>{d}</option>;
            })}
          </select>
        </label>
      </section>

      {metrics && (
        <>
          {/* Resumen KPI */}
          <div className="metrics-grid">
            <div className="metric-card">Diversidad: <strong>{metrics.diversity}</strong></div>
            <div className="metric-card">Consistencia: <strong>{metrics.consistency}%</strong></div>
            <div className="metric-card">
              Ratio Activo/Reposo: <strong>
                {(metrics.active/metrics.rest).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">
            {/* Pie Distribución */}
            <div className="chart-block">
              <h3>Distribución % por Categoría</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={metrics.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {metrics.distribution.map((_,i)=>
                      <Cell key={i} fill={COLORS[i%COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Barras Horas */}
            <div className="chart-block">
              <h3>Horas por Categoría</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.hours} margin={{ top:20, right:30, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Balance */}
            <div className="chart-block">
              <h3>Balance Autocuidado/Obligaciones/Ocio</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={metrics.groupBalance} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0,100]} />
                  <Radar dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Gauge Activo/Reposo */}
            <div className="chart-block">
              <h3>Ratio Activo/Reposo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart 
                  innerRadius="80%" outerRadius="100%" barSize={20}
                  data={[
                    { name:'Activo', value: metrics.active },
                    { name:'Reposo', value: metrics.rest }
                  ]}
                  startAngle={180} endAngle={0}
                >
                  <RadialBar minAngle={15} dataKey="value" cornerRadius={10} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Ocupación Horaria */}
            <div className="chart-block">
              <h3>Ocupación Horaria</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.hourly} margin={{ top:20, right:30, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Objetivos */}
            <div className="chart-block full-width">
              <h3>Cumplimiento de Objetivos</h3>
              <table className="objectives-table">
                <thead>
                  <tr><th>Actividad</th><th>Objetivo (min)</th><th>Real (min)</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {metrics.objectives.map((o,i)=>(
                    <tr key={i} className={o.compliant? 'ok':'nok'}>
                      <td>{o.subject}</td>
                      <td>{o.targetMin}{o.max?`–${o.max}`:''}</td>
                      <td>{o.actual}</td>
                      <td>{o.compliant? '✅':'❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PatientRoutines;
