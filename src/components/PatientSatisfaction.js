// src/components/PatientInterests.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import '../styles/therapistRoutines.css';

export default function PatientSatisfaction() {
  const { patientId } = useParams();
  const [diary, setDiary] = useState(undefined);
  const [metrics, setMetrics] = useState(null);

  // Map activityId ➔ category
  const categoryMap = {
    futbol: 'Ocio',
    dibujos: 'Ocio',
    comics: 'Ocio',
    tarea: 'Obligaciones',
    videojuegos: 'Ocio',
    helado: 'Ocio',
    parque: 'Ocio',
    banio: 'Autocuidado',
    dormir: 'Autocuidado',
    musica: 'Ocio',
    bailar: 'Ocio',
    amigos: 'Ocio',
    bicicleta: 'Ocio',
    dibujar: 'Ocio',
    mascotas: 'Ocio',
    experimentos: 'Obligaciones',
    cantar: 'Ocio',
    lego: 'Ocio',
    nadar: 'Autocuidado',
    computadora: 'Ocio'
  };

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`/api/emotions?patientId=${patientId}`, {
          headers: { 'x-auth-token': token }
        });
        setDiary(data && data.length > 0 ? data[0].diary : null);
      } catch {
        setDiary(null);
      }
    };
    fetchDiary();
  }, [patientId]);

  useEffect(() => {
    if (!Array.isArray(diary) || diary.length === 0) return;

    const ratings = diary.map(e => e.rating);
    const n = ratings.length;
    const sum = ratings.reduce((a, b) => a + b, 0);
    const average = +(sum / n).toFixed(2);

    // Min, Max
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    // Median
    const sorted = [...ratings].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const median = n % 2 === 0
      ? +(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
      : sorted[mid];

    // Mode
    const freq = {};
    ratings.forEach(r => (freq[r] = (freq[r] || 0) + 1));
    const mode = +Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

    // Std dev
    const variance = ratings.reduce((acc, r) => acc + (r - average) ** 2, 0) / n;
    const stdDev = +Math.sqrt(variance).toFixed(2);

    // Distribution 1–5
    const distribution = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: freq[r] || 0
    }));

    // Positive / Neutral / Negative
    const pos = distribution.filter(d => d.rating >= 4).reduce((a, d) => a + d.count, 0);
    const neu = distribution.find(d => d.rating === 3).count;
    const neg = distribution.filter(d => d.rating <= 2).reduce((a, d) => a + d.count, 0);
    const pnDistribution = [
      { category: 'Positivo (4–5)', value: pos },
      { category: 'Neutral (3)',      value: neu },
      { category: 'Negativo (1–2)',  value: neg }
    ];

    // Activities data
    const activities = diary.map(e => ({ name: e.title, rating: e.rating }));

    // Unique activities & category variety
    const uniqueActivities = new Set(diary.map(e => e.activityId)).size;
    const catCounts = {};
    const catSums = {};
    diary.forEach(e => {
      const cat = categoryMap[e.activityId] || 'Otros';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      catSums[cat]   = (catSums[cat]   || 0) + e.rating;
    });
    const categoryDistribution = Object.entries(catCounts).map(([category, count]) => ({ category, count }));
    const categoryAvg = Object.entries(catSums).map(([category, sum]) => ({
      category,
      avg: +(sum / catCounts[category]).toFixed(2)
    }));
    const categoryVariety = Object.keys(catCounts).length;

    // Top 3 & bottom 3 activities by rating
    const sortedActs = [...activities].sort((a, b) => b.rating - a.rating);
    const top3 = sortedActs.slice(0, 3);
    const bottom3 = sortedActs.slice(-3).reverse();

    setMetrics({
      average, median, mode, stdDev, minRating, maxRating,
      distribution, pnDistribution,
      activities,
      uniqueActivities, categoryVariety,
      categoryDistribution, categoryAvg,
      top3, bottom3
    });
  }, [diary]);

  if (diary === undefined) {
    return (
      <div className="routines-container">
        <header className="routines-header">
          <Link to="/therapist/interests">← Volver</Link>
          <h2>Estadísticas de Emociones</h2>
        </header>
        <p>Cargando diario…</p>
      </div>
    );
  }
  if (diary === null) {
    return (
      <div className="routines-container">
        <header className="routines-header">
          <Link to="/therapist/interests">← Volver</Link>
          <h2>Estadísticas de Emociones</h2>
        </header>
        <p>No hay diario guardado para este paciente.</p>
      </div>
    );
  }
  if (!metrics) {
    return (
      <div className="routines-container">
        <header className="routines-header">
          <Link to="/therapist/satisfaction">← Volver</Link>
          <h2>Estadísticas de Emociones</h2>
        </header>
        <p>Calculando estadísticas…</p>
      </div>
    );
  }

  const COLORS = ['#8884d8','#82ca9d','#ffc658','#ff8042','#0088FE'];
  const PN_COLORS = ['#82ca9d','#ffc658','#ff8042'];
  const CAT_COLORS = ['#8884d8','#82ca9d','#ffc658','#ff8042'];

  return (
    <div className="routines-container">
      <header className="routines-header">
        <Link to="/therapist/interests">← Volver</Link>
        <h2>Estadísticas de Emociones</h2>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">Promedio: <strong>{metrics.average}</strong></div>
        <div className="metric-card">Mediana: <strong>{metrics.median}</strong></div>
        <div className="metric-card">Moda: <strong>{metrics.mode}</strong></div>
        <div className="metric-card">Desviación: <strong>{metrics.stdDev}</strong></div>
        <div className="metric-card">Mín / Máx: <strong>{metrics.minRating} / {metrics.maxRating}</strong></div>
        <div className="metric-card">Únicas: <strong>{metrics.uniqueActivities}</strong></div>
        <div className="metric-card">Categorías: <strong>{metrics.categoryVariety}</strong></div>
        <div className="metric-card">Actividades: <strong>{metrics.activities.length}</strong></div>
      </div>

      <div className="charts-grid">
        {/* Distribución de Puntuaciones */}
        <div className="chart-block">
          <h3>Distribución de Calificaciones</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.distribution}
                dataKey="count"
                nameKey="rating"
                cx="50%" cy="50%"
                outerRadius={80}
                label
              >
                {metrics.distribution.map((_,i) =>
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                )}
              </Pie>
              <Tooltip /><Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pos/Neu/Neg */}
        <div className="chart-block">
          <h3>Positivo / Neutral / Negativo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.pnDistribution}
                dataKey="value"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={80}
                label
              >
                {metrics.pnDistribution.map((_,i) =>
                  <Cell key={i} fill={PN_COLORS[i % PN_COLORS.length]} />
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conteo por Categoría */}
        <div className="chart-block">
          <h3>Conteo por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.categoryDistribution} margin={{ top:20, right:30, left:0, bottom:0 }}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={CAT_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Nota Media por Categoría */}
        <div className="chart-block">
          <h3>Nota Media por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.categoryAvg} margin={{ top:20, right:30, left:0, bottom:0 }}>
              <XAxis dataKey="category" />
              <YAxis domain={[1,5]} />
              <Tooltip />
              <Bar dataKey="avg" fill={CAT_COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Calificación por Actividad */}
        <div className="chart-block full-width">
          <h3>Calificación por Actividad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={metrics.activities}
              margin={{ top:20, right:30, left:0, bottom:0 }}
            >
              <XAxis dataKey="name" />
              <YAxis domain={[1,5]} />
              <Tooltip />
              <Bar dataKey="rating" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 Actividades */}
        <div className="chart-block">
          <h3>Top 3 Actividades</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.top3} layout="vertical" margin={{ top:10, right:30, left:50, bottom:5 }}>
              <XAxis type="number" domain={[1,5]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="rating" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom 3 Actividades */}
        <div className="chart-block">
          <h3>Peor 3 Actividades</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.bottom3} layout="vertical" margin={{ top:10, right:30, left:50, bottom:5 }}>
              <XAxis type="number" domain={[1,5]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="rating" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
