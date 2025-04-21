import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line,
  ResponsiveContainer
} from 'recharts';
import '../styles/TherapistRoutines.css';

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
// Mapeo de categoría a grupo para radar y gauge
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
  const [selected, setSelected] = useState(null);
  const [metrics, setMetrics] = useState(null);
  
  // Fetchar resultados de juego
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`/api/game?patientId=${patientId}`, {
      headers: { 'x-auth-token': token }
    }).then(resp => {
      setResults(resp.data);
      // filtro por defecto: últimos 7 días
      const now = new Date(), weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      const f = weekAgo.toISOString().slice(0,10);
      const t = now.toISOString().slice(0,10);
      setFrom(f);
      setTo(t);
    }).catch(console.error);
  }, [patientId]);

  // Aplicar filtro de fechas
  useEffect(() => {
    if (!from||!to) return;
    const fDate = new Date(from), tDate = new Date(to);
    // include entire 'to' day
    tDate.setHours(23,59,59,999);
    const arr = results.filter(r=>{
      const d = new Date(r.createdAt);
      return d>=fDate&&d<=tDate;
    });
    setFiltered(arr);
  }, [results, from, to]);

  // Seleccionar primer resultado filtrado
  useEffect(() => {
    if (filtered.length) setSelected(filtered[0].createdAt);
    else setSelected(null);
  }, [filtered]);

  // Calcular métricas cuando cambia el seleccionado
  useEffect(() => {
    if (!selected) return;
    const res = filtered.find(r=>r.createdAt===selected);
    if (!res) { setMetrics(null); return; }
    const m = computeMetrics(res, filtered);
    setMetrics(m);
  }, [selected, filtered]);

  // Función para computar métricas
  function computeMetrics(result, allResults) {
    const slots = result.timeSlots || [];
    const activities = slots.flatMap(slot =>
      (slot.activities||[]).map(act=>({ ...act, slot: slot.slot }))
    );
    const totalMin = activities.reduce((sum,a)=>sum+a.duration,0);
    
    // 1. Distribución % por categoría
    const catSum = {};
    activities.forEach(a=>{
      const c = categoryMap[a.activityId]||'Otros';
      catSum[c] = (catSum[c]||0) + a.duration;
    });
    const distribution = Object.entries(catSum).map(([name,val])=>({ name, value: +((val/totalMin)*100).toFixed(1) }));
    
    // 2. Horas absolutas por categoría
    const hours = Object.entries(catSum).map(([name,val])=>({ name, hours: +(val/60).toFixed(2) }));
    
    // 3. Diversidad de actividades
    const diversity = new Set(activities.map(a=>a.activityId)).size;
    
    // 4. Consistencia diaria
    const covered = slots.filter(s=>s.activities?.length>0).length;
    const consistency = +((covered/24)*100).toFixed(1);
    
    // 5. Patrón horario
    const periods = { Mañana:[6,11], Tarde:[12,17], Noche:[18,23] };
    const pdSum = { Mañana:0, Tarde:0, Noche:0 };
    activities.forEach(a=>{
      const h = parseInt(a.slot.split(':')[0],10);
      for(let p in periods){
        const [s,e]=periods[p];
        if (h>=s&&h<=e) pdSum[p]+=a.duration;
      }
    });
    const timeOfDay = Object.entries(pdSum).map(([name,val])=>({ name, hours: +(val/60).toFixed(2) }));
    
    // 6. Balance autocuidado/productividad/ocio
    const grpSum = { Autocuidado:0, Obligaciones:0, Ocio:0 };
    activities.forEach(a=>{
      const cat = categoryMap[a.activityId]||'Ocio';
      const grp = groupMap[cat]||'Ocio';
      grpSum[grp] += a.duration;
    });
    const groupBalance = Object.entries(grpSum).map(([subject,val])=>({ subject, value: +((val/totalMin)*100).toFixed(1) }));
    
    // 7. Tendencia semanal: % por grupo día a día
    const trend = allResults.map(r=>{
      const dslots = r.timeSlots||[];
      const acts = dslots.flatMap(sl=>sl.activities.map(act=>({...act, slot:sl.slot})));
      const total = acts.reduce((s,a)=>s+a.duration,0);
      const sums = { Autocuidado:0, Obligaciones:0, Ocio:0 };
      acts.forEach(a=>{
        const cat=categoryMap[a.activityId]||'Ocio';
        const g=groupMap[cat]||'Ocio';
        sums[g]+=a.duration;
      });
      return {
        date: new Date(r.createdAt).toLocaleDateString(),
        Autocuidado: +( (sums.Autocuidado/total)*100 ).toFixed(1),
        Obligaciones:+( (sums.Obligaciones/total)*100 ).toFixed(1),
        Ocio:       +( (sums.Ocio/total)*100 ).toFixed(1)
      };
    });
    
    // 8. Índice de equilibrio global
    const N = distribution.length;
    const uniform = 1/N;
    const idx = 1 - (distribution.reduce((acc,cat)=>(acc+Math.abs(cat.value-uniform)),0)/2);
    const balanceIndex = +idx.toFixed(2);
    
    return { distribution, hours, diversity, consistency, timeOfDay, groupBalance, trend, balanceIndex };
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
            {filtered.map(r=>{
              const d = new Date(r.createdAt).toLocaleDateString();
              return <option key={r.createdAt} value={r.createdAt}>{d}</option>;
            })}
          </select>
        </label>
      </section>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">Diversidad: <strong>{metrics.diversity}</strong></div>
          <div className="metric-card">Consistencia: <strong>{metrics.consistency}%</strong></div>
          <div className="metric-card">Índice Equilibrio: <strong>{metrics.balanceIndex}</strong></div>
        </div>
      )}
      {metrics && (
        <div className="charts-grid">
          <div className="chart-block">
            <h3>Distribución % por Categoría</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={metrics.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {metrics.distribution.map((entry, i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

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

          <div className="chart-block full-width">
            <h3>Tendencia Semanal (% por Grupo)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trend} margin={{ top:20, right:30, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Autocuidado" stroke="#8884d8" />
                <Line type="monotone" dataKey="Obligaciones" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Ocio" stroke="#ffc658" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientRoutines;