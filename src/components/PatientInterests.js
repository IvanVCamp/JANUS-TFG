import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import '../styles/therapistRoutines.css';

export default function PatientInterests() {
    const { patientId } = useParams();
  const [mapData, setMapData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Map de elemento ➔ dominio OT
  const domainMap = {
    estadio:    'Actividad Física',
    parque:     'Ocio',
    colegio:    'Productividad',
    biblioteca: 'Productividad',
    hospital:   'Autocuidado'
  };

  // Colores para gráficos
  const DOMAIN_COLORS = ['#8884d8','#82ca9d','#ffc658','#ff8042'];
  const SIZE_COLORS   = ['#ff8042','#ffc658','#82ca9d'];

  useEffect(() => {
    const fetchMap = async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/planet-map?patientId=${patientId}`, {
        headers: { 'x-auth-token': token }
      });
      setMapData(data);
    };
    fetchMap();
  }, [patientId]);

  useEffect(() => {
    if (!mapData?.elements) return;
    const elems     = mapData.elements;
    const total     = elems.length;
    const domains   = [...new Set(Object.values(domainMap))];

    // 1) Conteo y suma de tamaños por dominio
    const countByDom = {}, sumSizeByDom = {};
    domains.forEach(d => { countByDom[d] = 0; sumSizeByDom[d] = 0; });
    elems.forEach(el => {
      const dom = domainMap[el.elementId] || 'Otro';
      countByDom[dom]  = (countByDom[dom] || 0) + 1;
      sumSizeByDom[dom]= (sumSizeByDom[dom] || 0) + el.size;
    });

    // 2) % Distribución por dominio
    const distribution = domains.map((d) => ({
      name:  d,
      value: +((countByDom[d]/total)*100).toFixed(1)
    }));

    // 3) Tamaño promedio por dominio
    const avgSizeByDom = domains.map(d => ({
      name: d,
      avg: countByDom[d] > 0
        ? +(sumSizeByDom[d]/countByDom[d]).toFixed(2)
        : 0
    }));

    // 4) Desviación estándar de distribución (%)
    const meanPct = 100/domains.length;
    const variance = distribution.reduce((acc, {value}) =>
      acc + Math.pow(value-meanPct, 2), 0
    ) / domains.length;
    const stdDevDist = +Math.sqrt(variance).toFixed(1);

    // 5) Dominios subutilizados (0 elementos)
    const underused = distribution.filter(d => d.value === 0).length;

    // 6) Engagement global por dominio
    const engagement = {};
    distribution.forEach(d => { engagement[d.name] = d.value; });

    // 7) Distribución de niveles de preferencia (tamaño)
    const lowCount  = elems.filter(e => e.size===1).length;
    const medCount  = elems.filter(e => e.size===2).length;
    const highCount = elems.filter(e => e.size===3).length;
    const sizeDist = [
      { name:'Baja (1)',  value: lowCount  },
      { name:'Media (2)', value: medCount  },
      { name:'Alta (3)',  value: highCount }
    ];
    const highPct = +((highCount/total)*100).toFixed(1);

    // 8) Índice de Equilibrio Ocupacional
    const diffSum = distribution.reduce((acc,d) =>
      acc + Math.abs(d.value - meanPct), 0
    );
    const occBalance = +((100 - diffSum/2)).toFixed(1);

    // 9) Top 3 elementos por tamaño
    const top3 = [...elems]
      .sort((a,b)=>b.size-a.size)
      .slice(0,3)
      .map(el=>({ title: el.title, size: el.size }));

    setMetrics({
      total,
      stdDevDist,
      underused,
      highPct,
      occBalance,
      engagement,
      distribution,
      avgSizeByDom,
      sizeDist,
      top3,
    });
  }, [mapData]);

  if (!mapData) {
    return (
      <div className="routines-container">
        <header className="routines-header">
          <Link to="/therapist/interests">← Volver</Link>
          <h2>Intereses – Planet Map</h2>
        </header>
        <p>Cargando datos…</p>
      </div>
    );
  }
  if (!metrics) {
    return (
      <div className="routines-container">
        <header className="routines-header">
          <Link to="/therapist/interests">← Volver</Link>
          <h2>Intereses – Planet Map</h2>
        </header>
        <p>Generando estadísticas…</p>
      </div>
    );
  }

  return (
    <div className="routines-container">
      <header className="routines-header">
        <Link to="/therapist/interests">← Volver</Link>
        <h2>Estadísticas de Planet Map</h2>
      </header>

      {/* Métricas clave */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span>Total de Elementos: <strong>{metrics.total}</strong></span>
          <i
            className="fa fa-info-circle info-icon"
            title="Número total de elementos que el paciente colocó en su Planet Map."
          ></i>
        </div>
        <div className="metric-card">
          <span>Desv. Preferencias (%): <strong>{metrics.stdDevDist}</strong></span>
          <i
            className="fa fa-info-circle info-icon"
            title="Desviación estándar de la distribución porcentual entre dominios, mide dispersión de intereses."
          ></i>
        </div>
        <div className="metric-card">
          <span>Dominios Sin Uso: <strong>{metrics.underused}</strong></span>
          <i
            className="fa fa-info-circle info-icon"
            title="Cantidad de dominios (Autocuidado, Ocio, etc.) en los que no hay ningún elemento."
          ></i>
        </div>
        <div className="metric-card">
          <span>Alta Preferencia: <strong>{metrics.highPct}%</strong></span>
          <i
            className="fa fa-info-circle info-icon"
            title="Porcentaje de elementos marcados con tamaño 'Alta (3)', refleja intereses fuertes."
          ></i>
        </div>
        <div className="metric-card">
          <span>Equilibrio Ocup.: <strong>{metrics.occBalance}%</strong></span>
          <i
            className="fa fa-info-circle info-icon"
            title="Índice de equilibrio entre dominios: 100% = distribución perfectamente uniforme."
          ></i>
        </div>
      </div>

      {/* Gráficos con descripciones */}
      <div className="charts-grid">
        <div className="chart-block">
          <h3>Engagement por Dominio</h3>
          <p className="chart-description">
            Mide el porcentaje de elementos asignados a cada dominio ocupacional (Autocuidado, Ocio, Productividad, Actividad Física).
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={Object.entries(metrics.engagement).map(([name,value])=>({name,value}))}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip/>
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-block">
          <h3>Distribución % por Dominio</h3>
          <p className="chart-description">
            Porcentaje del total de elementos colocados que corresponde a cada dominio, identifica dominancias.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.distribution}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                label
              >
                {metrics.distribution.map((_,i)=>(
                  <Cell key={i} fill={DOMAIN_COLORS[i%DOMAIN_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip/><Legend verticalAlign="bottom"/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-block">
          <h3>Tamaño Promedio por Dominio</h3>
          <p className="chart-description">
            Tamaño medio de los elementos en cada dominio (1=pequeño, 2=mediano, 3=grande), refleja intensidad de preferencia.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.avgSizeByDom} margin={{top:20,right:30,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="avg" fill="#ffc658"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-block">
          <h3>Distribución de Preferencias</h3>
          <p className="chart-description">
            Cuenta de elementos según nivel de preferencia (Baja/Media/Alta), muestra inclinaciones globales.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.sizeDist}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={80}
                label
              >
                {metrics.sizeDist.map((_,i)=>(
                  <Cell key={i} fill={SIZE_COLORS[i%SIZE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip/><Legend verticalAlign="bottom"/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-block full-width">
          <h3>Top 3 Elementos</h3>
          <p className="chart-description">
            Elementos con tamaño más alto, indican intereses más fuertes del paciente.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={metrics.top3}
              layout="vertical"
              margin={{top:10,right:30,left:50,bottom:5}}
            >
              <XAxis type="number"/>
              <YAxis dataKey="title" type="category"/>
              <Tooltip/>
              <Bar dataKey="size" fill="#8884d8"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
