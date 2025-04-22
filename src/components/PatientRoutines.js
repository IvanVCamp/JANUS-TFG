// src/components/PatientRoutines.js
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

const categoryMap = {
  futbol: 'Ocio', dibujos: 'Ocio', comics: 'Ocio', tarea: 'Obligaciones',
  videojuegos: 'Ocio', helado: 'Ocio', parque: 'Ocio', banio: 'Autocuidado',
  dormir: 'Autocuidado', musica: 'Ocio', bailar: 'Ocio', amigos: 'Ocio',
  bicicleta: 'Ocio', dibujar: 'Ocio', mascotas: 'Ocio', experimentos: 'Obligaciones',
  cantar: 'Ocio', lego: 'Ocio', nadar: 'Autocuidado', computadora: 'Ocio'
};
const groupMap = {
  Autocuidado: 'Autocuidado',
  Obligaciones: 'Obligaciones',
  Ocio: 'Ocio'
};
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

function PatientRoutines() {
  const { patientId } = useParams();
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:8080/api/game?patientId=${patientId}`, {
      headers: { 'x-auth-token': token }
    }).then(({ data }) => {
      setResults(data);
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      setFrom(weekAgo.toISOString().slice(0,10));
      setTo(now.toISOString().slice(0,10));
    }).catch(console.error);
  }, [patientId]);

  // Filtrar por rango
  useEffect(() => {
    if (!from||!to) return;
    const f = new Date(from), t = new Date(to);
    t.setHours(23,59,59,999);
    setFiltered(results.filter(r=>{
      const d = new Date(r.createdAt);
      return d>=f && d<=t;
    }));
  }, [results, from, to]);

  // Seleccionar primer día
  useEffect(() => {
    setSelected(filtered.length? filtered[0].createdAt : null);
  }, [filtered]);

  // Calcular métricas
  useEffect(() => {
    if (!selected) return;
    const res = filtered.find(r=>r.createdAt===selected);
    setMetrics(res? computeMetrics(res): null);
  }, [selected, filtered]);

  function computeMetrics(r) {
    const slots = r.timeSlots || [];
    const acts = slots.flatMap(s => (s.activities||[])
      .map(a=>({ ...a, slot: s.slot })));
    const totalMin = acts.reduce((sum,a)=>sum+a.duration,0)||1;

    // 1 Distribución %
    const catSum = {};
    acts.forEach(a=>{
      const c = categoryMap[a.activityId]||'Otros';
      catSum[c] = (catSum[c]||0) + a.duration;
    });
    const distribution = Object.entries(catSum).map(([name,val])=>({
      name, value: +(val/totalMin*100).toFixed(1)
    }));

    // 2 Horas
    const hours = Object.entries(catSum).map(([name,val])=>({
      name, hours: +(val/60).toFixed(2)
    }));

    // 3 Diversidad
    const diversity = new Set(acts.map(a=>a.activityId)).size;

    // 4 Consistencia diaria (% de slots ocupados)
    const occupiedSlots = slots.filter(s=>s.activities?.length>0).length;
    const consistency = +((occupiedSlots/24*100).toFixed(1));

    // 5 Grupo balance radar
    const grpSum = { Autocuidado:0, Obligaciones:0, Ocio:0 };
    acts.forEach(a=>{
      const cat = categoryMap[a.activityId]||'Ocio';
      grpSum[groupMap[cat]] += a.duration;
    });
    const groupBalance = Object.entries(grpSum).map(([subject,val])=>({
      subject, value: +(val/totalMin*100).toFixed(1)
    }));

    // 6 Balance índice gauge (entropía inversa)
    const N = distribution.length;
    const uniform = 100/N;
    const distDiff = distribution.reduce((acc, d)=> acc + Math.abs(d.value-uniform), 0)/2;
    const balanceIndex = +((100-distDiff)/100).toFixed(2)*100;

    // 7 Top 3 actividades
    const actSum = {};
    acts.forEach(a=> actSum[a.activityId] = (actSum[a.activityId]||0)+a.duration);
    const top3 = Object.entries(actSum)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,3)
      .map(([id,val])=>({ name: id, hours: +(val/60).toFixed(2) }));

    return { distribution, hours, diversity, consistency, groupBalance, balanceIndex, top3 };
  }

  return (
    <div className="routines-container">
      <header className="routines-header">
        <Link to="/therapist/routines">← Volver</Link>
        <h2>Estadísticas de Rutinas</h2>
      </header>

      <section className="filter-section">
        <label>Desde:<input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>Hasta:<input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <label>Día:
          <select value={selected||''} onChange={e=>setSelected(e.target.value)}>
            {filtered.map(r=>{
              const d = new Date(r.createdAt).toLocaleDateString();
              return <option key={r.createdAt} value={r.createdAt}>{d}</option>;
            })}
          </select>
        </label>
      </section>

      {metrics && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">Diversidad: <strong>{metrics.diversity}</strong></div>
            <div className="metric-card">Consistencia: <strong>{metrics.consistency}%</strong></div>
            <div className="metric-card">Equilibrio: <strong>{metrics.balanceIndex}%</strong></div>
          </div>

          <div className="charts-grid">
            <div className="chart-block">
              <h3>Distribución % por Categoría</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={metrics.distribution} dataKey="value" nameKey="name"
                       cx="50%" cy="50%" outerRadius={80} label>
                    {metrics.distribution.map((_,i)=>
                      <Cell key={i} fill={COLORS[i%COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-block">
              <h3>Horas por Categoría</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.hours} margin={{ top:20,right:30,left:0,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-block">
              <h3>Balance Grupo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={metrics.groupBalance} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0,100]} />
                  <Radar dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6}/>
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-block">
              <h3>Índice de Equilibrio</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                  data={[{ name: 'Equilibrio', value: metrics.balanceIndex }]}
                  startAngle={180} endAngle={0}
                >
                  <RadialBar minAngle={15} background clockWise dataKey="value" />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right"/>
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-block full-width">
              <h3>Top 3 Actividades por Tiempo</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.top3} layout="vertical" margin={{ top:10,right:30,left:50,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis type="number"/>
                  <YAxis dataKey="name" type="category"/>
                  <Tooltip/>
                  <Bar dataKey="hours" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PatientRoutines;
