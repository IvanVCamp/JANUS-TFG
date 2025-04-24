// src/components/PatientRoutines.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import '../styles/therapistRoutines.css';

// Fixed list of categories (in lowercase)
const ALL_CATEGORIES = [
  'cuidado personal',
  'actividades escolares',
  'juego y tiempo libre',
  'participación comunitaria',
  'descanso y sueño'
];

// Map activityId ➔ category
const categoryMap = {
  futbol: 'juego y tiempo libre',
  dibujos: 'juego y tiempo libre',
  comics: 'juego y tiempo libre',
  tarea: 'actividades escolares',
  videojuegos: 'juego y tiempo libre',
  helado: 'juego y tiempo libre',
  parque: 'participación comunitaria',
  banio: 'cuidado personal',
  dormir: 'descanso y sueño',
  musica: 'juego y tiempo libre',
  bailar: 'juego y tiempo libre',
  amigos: 'participación comunitaria',
  bicicleta: 'juego y tiempo libre',
  dibujar: 'juego y tiempo libre',
  mascotas: 'juego y tiempo libre',
  experimentos: 'actividades escolares',
  cantar: 'juego y tiempo libre',
  lego: 'juego y tiempo libre',
  nadar: 'cuidado personal',
  computadora: 'juego y tiempo libre'
};

export default function PatientRoutines() {
  const { patientId } = useParams();
  const [results, setResults] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [multi, setMulti] = useState(null);
  const [wedRecord, setWedRecord] = useState(null);
  const [satRecord, setSatRecord] = useState(null);
  const [comparisonData, setComparisonData] = useState([]);

  // Fetch all game results for patient
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`/api/game?patientId=${patientId}`, {
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

  // Filter results by date range
  useEffect(() => {
    if (!from || !to) return;
    const f = new Date(from), t = new Date(to);
    t.setHours(23,59,59,999);
    const filt = results.filter(r => {
      const d = new Date(r.createdAt);
      return d >= f && d <= t;
    });
    setFiltered(filt);
    setWedRecord(filt.find(r => r.day === 'Miércoles') || null);
    setSatRecord(filt.find(r => r.day === 'Sábado') || null);
  }, [results, from, to]);

  // Default select first available day
  useEffect(() => {
    setSelected(filtered.length ? filtered[0].createdAt : null);
  }, [filtered]);

  // Compute metrics for selected day
  useEffect(() => {
    if (!selected) return;
    const res = filtered.find(r => r.createdAt === selected);
    if (!res) return;
    const slots = res.timeSlots || [];
    const acts = slots.flatMap(s => s.activities || []);
    const totalMin = acts.reduce((sum,a) => sum + a.duration, 0) || 1;

    // Sum minutes per category
    const catSum = {};
    ALL_CATEGORIES.forEach(cat => catSum[cat] = 0);
    acts.forEach(a => {
      const cat = categoryMap[a.activityId];
      if (cat) catSum[cat] += a.duration;
    });

    // Distribution % by category
    const distribution = ALL_CATEGORIES.map(name => ({
      name,
      value: +((catSum[name] / totalMin * 100) || 0).toFixed(1)
    }));

    // Hours by category
    const hours = ALL_CATEGORIES.map(name => ({
      name,
      hours: +(catSum[name] / 60).toFixed(2)
    }));

    // Diversity (# unique activities)
    const diversity = new Set(acts.map(a => a.activityId)).size;

    // Consistency (% slots occupied)
    const occupiedSlots = slots.filter(s => s.activities?.length > 0).length;
    const consistency = +((occupiedSlots / 24 * 100).toFixed(1));

    // Fragmentation index: count category transitions between consecutive hours
    const fragmentation = slots.reduce((acc, slot, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      const prevAct = prev.activities?.[0] || null;
      const currAct = slot.activities?.[0] || null;
      const prevCat = prevAct ? categoryMap[prevAct.activityId] : null;
      const currCat = currAct ? categoryMap[currAct.activityId] : null;
      return (prevCat && currCat && prevCat !== currCat) ? acc + 1 : acc;
    }, 0);

    // Transitions details
    const transitions = slots.slice(1).reduce((acc, slot, idx) => {
      const prev = slots[idx];
      const prevAct = prev.activities?.[0] || null;
      const currAct = slot.activities?.[0] || null;
      const prevCat = prevAct ? categoryMap[prevAct.activityId] : null;
      const currCat = currAct ? categoryMap[currAct.activityId] : null;
      if (prevCat && currCat && prevCat !== currCat) {
        acc.push({
          time: slot.slot,
          from: prevAct.title,
          to: currAct.title
        });
      }
      return acc;
    }, []);

    // Balance index (inverse entropy-like)
    const N = distribution.length;
    const uniform = 100 / N;
    const distDiff = distribution.reduce((acc,d) =>
      acc + Math.abs(d.value - uniform), 0) / 2;
    const balanceIndex = +((100 - distDiff) / 100 * 100).toFixed(1);

    // Top 3 activities by time
    const actSum = {};
    acts.forEach(a => {
      actSum[a.activityId] = (actSum[a.activityId]||0) + a.duration;
    });
    const top3 = Object.entries(actSum)
      .sort((a,b) => b[1] - a[1]).slice(0,3)
      .map(([id,val]) => ({ name: id, hours: +(val/60).toFixed(2) }));

    // Sleep hours
    const sleepHours = +(catSum['descanso y sueño'] / 60).toFixed(2);

    setMetrics({
      distribution,
      hours,
      diversity,
      consistency,
      fragmentation,
      transitions,
      groupBalance: distribution,
      balanceIndex,
      top3,
      sleepHours
    });
  }, [selected, filtered]);

  // Compute multi-day metrics
  useEffect(() => {
    if (!filtered.length) {
      setMulti(null);
      return;
    }
    const sleepData = filtered.map(r => {
      const date = new Date(r.createdAt).toLocaleDateString();
      const sleepMin = r.timeSlots.reduce((sum, slot) => {
        const e = slot.activities?.find(a => a.activityId === 'dormir');
        return sum + (e ? e.duration : 0);
      }, 0);
      return { date, hours: +(sleepMin/60).toFixed(2) };
    });
    const dayPercents = filtered.map(r => {
      const acts = r.timeSlots.flatMap(s => s.activities || []);
      const total = acts.reduce((sum,a)=>sum+a.duration,0)||1;
      const sums = {}; ALL_CATEGORIES.forEach(cat => sums[cat]=0);
      acts.forEach(a => {
        const cat = categoryMap[a.activityId];
        if (cat) sums[cat] += a.duration;
      });
      return ALL_CATEGORIES.reduce((obj,cat) => {
        obj[cat] = +(sums[cat]/total*100).toFixed(1);
        return obj;
      }, {});
    });
    const categoryVariance = ALL_CATEGORIES.map(cat => {
      const vals = dayPercents.map(d => d[cat]);
      const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
      const varr = vals.reduce((acc,v)=>acc+(v-mean)**2,0)/vals.length;
      return { category: cat, variance: +varr.toFixed(2) };
    });
    setMulti({ sleepData, categoryVariance });
  }, [filtered]);

  // Prepare comparison data when both days present
  useEffect(() => {
    if (wedRecord && satRecord) {
      const computeHours = rec => {
        const catSum = {};
        ALL_CATEGORIES.forEach(cat => catSum[cat] = 0);
        rec.timeSlots.flatMap(s => s.activities||[]).forEach(a => {
          const cat = categoryMap[a.activityId];
          if (cat) catSum[cat] += a.duration;
        });
        return ALL_CATEGORIES.map(name => ({
          category: name,
          Wed: +(catSum[name]/60).toFixed(2)
        }));
      };
      const wedHours = computeHours(wedRecord);
      const satSum = {};
      ALL_CATEGORIES.forEach(cat => satSum[cat] = 0);
      satRecord.timeSlots.flatMap(s => s.activities||[]).forEach(a => {
        const cat = categoryMap[a.activityId];
        if (cat) satSum[cat] += a.duration;
      });
      const data = wedHours.map(item => ({
        category: item.category,
        Wed: item.Wed,
        Sat: +(satSum[item.category]/60).toFixed(2)
      }));
      setComparisonData(data);
    } else {
      setComparisonData([]);
    }
  }, [wedRecord, satRecord]);

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
            {filtered.map(r => {
              const d = new Date(r.createdAt).toLocaleDateString();
              return <option key={r.createdAt} value={r.createdAt}>{d}</option>;
            })}
          </select>
        </label>
      </section>

      {metrics && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span>Diversidad: <strong>{metrics.diversity}</strong></span>
              <i className="fa fa-info-circle info-icon" title="Número de actividades distintas realizadas en el día."></i>
            </div>
            <div className="metric-card">
              <span>Consistencia: <strong>{metrics.consistency}%</strong></span>
              <i className="fa fa-info-circle info-icon" title="Porcentaje de franjas horarias ocupadas."></i>
            </div>
            <div className="metric-card">
              <span>Fragmentación: <strong>{metrics.fragmentation}</strong></span>
              <i className="fa fa-info-circle info-icon" title="Número de cambios de categoría entre horas consecutivas."></i>
            </div>
            <div className="metric-card">
              <span>Equilibrio: <strong>{metrics.balanceIndex}%</strong></span>
              <i className="fa fa-info-circle info-icon" title="Equilibrio relativo entre categorías."></i>
            </div>
            <div className="metric-card">
              <span>Sueño (h): <strong>{metrics.sleepHours}</strong></span>
              <i className="fa fa-info-circle info-icon" title="Horas dedicadas a descanso y sueño."></i>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-block">
              <h3>Distribución % por Categoría</h3>
              <p className="chart-description">Porcentaje de tiempo invertido en cada categoría.</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.distribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {metrics.distribution.map((_,i) =>
                      <Cell key={i} fill={['#8884d8','#82ca9d','#ffc658','#ff8042','#0088FE'][i%5]} />
                    )}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-block">
              <h3>Horas por Categoría</h3>
              <p className="chart-description">Transforma minutos a horas por categoría.</p>
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
              <h3>Balance de Categorías</h3>
              <p className="chart-description">Radar de distribución porcentual.</p>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={metrics.groupBalance} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0,100]} />
                  <Radar dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6}/>
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-block full-width">
              <h3>Top 3 Actividades</h3>
              <p className="chart-description">Actividades con más tiempo dedicado.</p>
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

      {multi && (
        <div className="charts-grid">
          <div className="chart-block">
            <h3>Tendencia de Sueño</h3>
            <p className="chart-description">Evolución diaria de horas de sueño.</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={multi.sleepData} margin={{ top:10,right:30,left:0,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="date"/>
                <YAxis/>
                <Tooltip/>
                <Line type="monotone" dataKey="hours" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-block">
            <h3>Variabilidad por Categoría</h3>
            <p className="chart-description">Varianza diaria de la distribución.</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={multi.categoryVariance} margin={{ top:20,right:30,left:0,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="variance" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <section className="chart-block full-width">
        <h3>Comparativa Miércoles vs Sábado</h3>
        {!wedRecord && <p>No se ha completado la rutina de <strong>Miércoles</strong>.</p>}
        {!satRecord && <p>No se ha completado la rutina de <strong>Sábado</strong>.</p>}
        {comparisonData.length > 0 && (
          <>
            <p className="chart-description">
              Horas dedicadas por categoría en ambos días. Permite identificar sesgos en la planificación semanal.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ top:20,right:30,left:0,bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="category"/>
                <YAxis/>
                <Tooltip/>
                <Legend />
                <Bar dataKey="Wed" name="Miércoles" fill="#82ca9d" />
                <Bar dataKey="Sat" name="Sábado" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </section>

      {metrics && metrics.transitions && metrics.transitions.length > 0 && (
        <section className="chart-block full-width">
          <h3>Detalles de Fragmentación</h3>
          <p className="chart-description">
            Cambios de actividad entre franjas horarias consecutivas:
          </p>
          <ul>
            {metrics.transitions.map((t, i) => (
              <li key={i}>
                A las <strong>{t.time}</strong> cambió de <em>{t.from}</em> a <em>{t.to}</em>.
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
