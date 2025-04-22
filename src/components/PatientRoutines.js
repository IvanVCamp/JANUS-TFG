import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer
} from 'recharts';
import '../styles/therapistRoutines.css';

// Mapeo de actividad a categoría
const categoryMap = {
  futbol:     'Ocio', dibujos:   'Ocio', comics:    'Ocio',
  tarea:      'Obligaciones', videojuegos: 'Ocio', helado:    'Ocio',
  parque:     'Ocio', banio:     'Autocuidado', dormir:    'Autocuidado',
  musica:     'Ocio', bailar:    'Ocio', amigos:    'Ocio',
  bicicleta:  'Ocio', dibujar:   'Ocio', mascotas:  'Ocio',
  experimentos: 'Obligaciones', cantar:    'Ocio', lego:      'Ocio',
  nadar:      'Autocuidado', computadora:'Ocio'
};
// Mapeo de categoría a grupo
const groupMap = {
  Autocuidado:   'Autocuidado',
  Obligaciones:  'Obligaciones',
  Ocio:          'Ocio'
};
// Colores para gráficos
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

function PatientRoutines() {
  const { patientId } = useParams();
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState('');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:8080/api/game?patientId=${patientId}`, {
      headers: { 'x-auth-token': token }
    }).then(resp => {
      setResults(resp.data);
      // filtro por defecto últimos 7 días
      const now = new Date(), weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      setFrom(weekAgo.toISOString().slice(0,10));
      setTo(now.toISOString().slice(0,10));
    }).catch(console.error);
  }, [patientId]);

  // aplicar filtro de fechas
  useEffect(() => {
    if (!from || !to) return;
    const fDate = new Date(from), tDate = new Date(to);
    tDate.setHours(23,59,59,999);
    setFiltered(results.filter(r => {
      const d = new Date(r.createdAt);
      return d >= fDate && d <= tDate;
    }));
  }, [results, from, to]);

  // seleccionar primer resultado
  useEffect(() => {
    if (filtered.length) setSelected(filtered[0].createdAt);
    else setSelected('');
  }, [filtered]);

  // calcular métricas al cambiar seleccionado
  useEffect(() => {
    if (!selected) { setMetrics(null); return; }
    const res = filtered.find(r => r.createdAt === selected);
    if (!res) { setMetrics(null); return; }
    setMetrics(computeMetrics(res));
  }, [selected, filtered]);

  function computeMetrics(result) {
    const slots = result.timeSlots || [];
    const activities = slots.flatMap(slot =>
      (slot.activities || []).map(act => ({ ...act, slot: slot.slot }))
    );
    const totalMin = activities.reduce((sum,a) => sum + a.duration, 0) || 1;

    // 1. Distribución % por categoría
    const catSum = {};
    activities.forEach(a => {
      const c = categoryMap[a.activityId] || 'Otros';
      catSum[c] = (catSum[c] || 0) + a.duration;
    });
    const distribution = Object.entries(catSum).map(([name,val]) => ({
      name,
      value: +((val/totalMin)*100).toFixed(1)
    }));

    // 2. Horas absolutas por categoría (para barra)
    const hours = Object.entries(catSum).map(([name,val]) => ({
      name,
      hours: +(val/60).toFixed(2)
    }));

    // 3. Índice de diversidad (entropía de Shannon)
    const diversity = distribution.reduce((H,cat) => {
      const p = cat.value/100;
      return p>0 ? H - p*Math.log2(p) : H;
    }, 0).toFixed(2);

    // 4. Consistencia diaria (% de slots usados)
    const usedSlots = slots.filter(s => s.activities && s.activities.length>0).length;
    const consistency = +((usedSlots/24)*100).toFixed(1);

    // 5. Balance activo/reposo ratio
    const active = (catSum['Obligaciones']||0) + (catSum['Ocio']||0);
    const rest   = (catSum['Autocuidado']||0);
    const activeRestRatio = +(active/rest || 0).toFixed(2);

    // 6. GroupBalance para radar
    const grpSum = { Autocuidado:0, Obligaciones:0, Ocio:0 };
    activities.forEach(a => {
      const grp = groupMap[categoryMap[a.activityId]] || 'Ocio';
      grpSum[grp] += a.duration;
    });
    const groupBalance = Object.entries(grpSum).map(([subject,val]) => ({
      subject,
      value: +((val/totalMin)*100).toFixed(1)
    }));

    // 7. Ocupación horaria
    const hourly = Array.from({length:24},(_,i) => ({ hour:`${i}:00`, minutes:0 }));
    activities.forEach(a => {
      const h = parseInt(a.slot.split(':')[0],10);
      hourly[h].minutes += a.duration;
    });

    // 8. Objetivos de ejemplo y cumplimiento
    const objectives = [
      { name:'Autocuidado ≥ 60 min', actual: grpSum.Autocuidado, target:60 },
      { name:'Obligaciones ≤ 300 min', actual: grpSum.Obligaciones, target:300 },
      { name:'Ocio ≥ 120 min', actual: grpSum.Ocio, target:120 }
    ].map(o => ({
      ...o,
      ok: o.name.includes('≤') ? o.actual <= o.target : o.actual >= o.target
    }));

    return {
      distribution,
      hours,
      diversity,
      consistency,
      activeRestRatio,
      groupBalance,
      hourly,
      objectives
    };
  }

  return (
    <div className="pr-container">
      <header className="pr-header">
        <Link to="/therapist/routines" className="back-link">← Volver</Link>
        <h2>Rutinas: Estadísticas</h2>
      </header>

      <section className="filter-section">
        <label>Desde:<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
        <label>Hasta:<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
        <label>Día:
          <select value={selected} onChange={e=>setSelected(e.target.value)}>
            {filtered.map(r => {
              const d = new Date(r.createdAt).toLocaleDateString();
              return <option key={r.createdAt} value={r.createdAt}>{d}</option>;
            })}
          </select>
        </label>
      </section>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">Diversidad: <strong>{metrics.diversity}</strong> bits</div>
          <div className="metric-card">Consistencia: <strong>{metrics.consistency}%</strong></div>
          <div className="metric-card">Activo/Reposo: <strong>{metrics.activeRestRatio}</strong></div>
        </div>
      )}

      {metrics && (
        <div className="charts-grid">
          <div className="chart-block">
            <h3>Distribución % por Categoría</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={metrics.distribution} dataKey="value" nameKey="name"
                     cx="50%" cy="50%" outerRadius={80} label>
                  {metrics.distribution.map((entry,i)=>
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  )}
                </Pie>
                <Tooltip/>
                <Legend verticalAlign="bottom"/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block">
            <h3>Horas por Categoría</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.hours} margin={{ top:20, right:30, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="hours" fill={COLORS[0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block">
            <h3>Balance Autocuidado/Obligaciones/Ocio</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={metrics.groupBalance} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid/>
                <PolarAngleAxis dataKey="subject"/>
                <PolarRadiusAxis angle={30} domain={[0,100]}/>
                <Radar dataKey="value" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.6}/>
                <Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block full-width">
            <h3>Ocupación Horaria (minutos)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.hourly} margin={{ top:20, right:30, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="hour"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="minutes" fill={COLORS[2]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metrics && (
        <section className="objectives-section">
          <h3>Cumplimiento de Objetivos</h3>
          <table className="objective-table">
            <thead>
              <tr><th>Objetivo</th><th>Real</th><th>Meta</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {metrics.objectives.map((o,i) => (
                <tr key={i} className={o.ok ? 'ok' : 'fail'}>
                  <td>{o.name}</td>
                  <td>{o.actual} min</td>
                  <td>{o.target} min</td>
                  <td>{o.ok ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default PatientRoutines;
