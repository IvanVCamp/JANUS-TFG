import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/taskPlanner.css';

/** 
 * Comprueba si dos fechas pertenecen al mismo día (ignora hora/minutos).
 */
function isSameDay(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Genera un array de slots representando las 24 horas del día:
 * ["00:00", "01:00", "02:00", ..., "23:00"].
 */
function generate24HourSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const label = `${String(hour).padStart(2, '0')}:00`;
    slots.push({ id: label, tasks: [] });
  }
  return slots;
}

/**
 * Devuelve un array con los días de un mes, incluyendo huecos vacíos
 * al inicio para alinear la cuadrícula (ej.: si el mes empieza en miércoles).
 */
function getMonthDays(year, month) {
  const days = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate(); // día 28..31
  const startWeekDay = firstDayOfMonth.getDay(); // 0=Domingo, 1=Lunes, etc.

  // Huecos "vacíos" antes del día 1
  for (let i = 0; i < startWeekDay; i++) {
    days.push(null);
  }

  // Días reales del mes
  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function TaskPlanner() {
  const navigate = useNavigate();

  // Estado con todas las tareas
  const [tasks, setTasks] = useState([]);

  // Vista actual: 'month' (mes) o 'day' (día)
  const [currentView, setCurrentView] = useState('month');

  // Fecha seleccionada para vista diaria
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Slots de 24 horas para la vista diaria
  const [timeSlots, setTimeSlots] = useState([]);

  // Año y mes actuales para la vista mensual
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Modal para crear tarea
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    category: 'Personal',
    startTime: '',
    endTime: '',
    reminderTime: ''
  });

  // Al montar, cargar tareas del backend
  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error al obtener tareas:', err);
      }
    }
    fetchTasks();
  }, []);

  // Generar la lista de 24 horas
  useEffect(() => {
    setTimeSlots(generate24HourSlots());
  }, []);

  // Reasignar tareas a los slots cuando cambien las tareas o la fecha
  // (solo aplica si estamos en vista diaria)
  useEffect(() => {
    if (currentView !== 'day') return;

    // Clonamos la lista de slots vacíos
    const updatedSlots = generate24HourSlots();

    // Filtrar tareas que pertenecen al día seleccionado
    const tasksOfDay = tasks.filter(t => isSameDay(t.startTime, selectedDate));

    // Para cada tarea, calculamos su slot por la hora
    tasksOfDay.forEach(task => {
      const hour = new Date(task.startTime).getHours();
      const slotId = `${String(hour).padStart(2, '0')}:00`;
      const slot = updatedSlots.find(s => s.id === slotId);
      if (slot) {
        slot.tasks.push(task);
      }
    });

    setTimeSlots(updatedSlots);
  }, [tasks, selectedDate, currentView]);

  /** 
   * Cambiar a vista diaria cuando se hace click en un día del mes.
   */
  const handleDayClick = (dayDate) => {
    setSelectedDate(dayDate);
    setCurrentView('day');
  };

  /** Navegar al mes anterior en la vista mensual */
  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  /** Navegar al mes siguiente en la vista mensual */
  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  /**
   * Manejo del drag & drop en la vista diaria.
   */
  const onDragEnd = async (result) => {
    if (currentView !== 'day') return; // Solo aplica en vista día

    const { source, destination, draggableId } = result;
    if (!destination) return; // Suelto fuera de droppable

    // Si no se cambió nada
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      // Localizamos la tarea arrastrada
      const task = tasks.find(t => t._id === draggableId);
      if (!task) return;

      // Nuevo slot (hora) al que se movió
      const [destHourStr] = destination.droppableId.split(':');
      const destHour = parseInt(destHourStr, 10);

      // Ajustamos su startTime a la nueva hora, manteniendo el día
      const newStart = new Date(task.startTime);
      newStart.setFullYear(selectedDate.getFullYear());
      newStart.setMonth(selectedDate.getMonth());
      newStart.setDate(selectedDate.getDate());
      newStart.setHours(destHour, 0, 0, 0);

      // Ejemplo: endTime = startTime + 1 hora
      const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

      // Actualizamos en backend
      const updatedTask = await taskService.updateTask(task._id, {
        startTime: newStart,
        endTime: newEnd
      });

      // Refrescamos en estado local
      setTasks(prev =>
        prev.map(t => (t._id === updatedTask._id ? updatedTask : t))
      );
    } catch (err) {
      console.error('Error actualizando tarea:', err);
    }
  };

  /**
   * Crear una nueva tarea (modal).
   */
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const created = await taskService.createTask(newTaskData);
      setTasks(prev => [...prev, created]);
      setShowCreateModal(false);
      // Reset form
      setNewTaskData({
        title: '',
        description: '',
        category: 'Personal',
        startTime: '',
        endTime: '',
        reminderTime: ''
      });
    } catch (err) {
      console.error('Error creando tarea:', err);
    }
  };

  /** Cerrar sesión (ejemplo) */
  const handleLogout = () => {
    navigate('/');
  };

  // ------------------
  // VISTA MENSUAL
  // ------------------
  const renderMonthView = () => {
    const daysArray = getMonthDays(currentYear, currentMonth);
    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

    // Agrupamos en filas de 7 celdas
    const rows = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      rows.push(daysArray.slice(i, i + 7));
    }

    return (
      <div className="month-view-container">
        <div className="month-nav">
          <button onClick={handlePrevMonth}>&lt; Anterior</button>
          <h2>{monthName} {currentYear}</h2>
          <button onClick={handleNextMonth}>Siguiente &gt;</button>
        </div>

        <div className="month-grid">
          <div className="week-days">
            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
          </div>
          {rows.map((row, rowIndex) => (
            <div className="week-row" key={rowIndex}>
              {row.map((day, colIndex) => {
                if (!day) {
                  // Celda vacía
                  return <div className="day-cell empty" key={colIndex}></div>;
                }
                // Tareas del día
                const dayTasks = tasks.filter(t => isSameDay(t.startTime, day));
                return (
                  <div
                    className="day-cell"
                    key={colIndex}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    <div className="day-tasks">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div key={task._id} className="day-task-item">
                          • {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="more-tasks">
                          +{dayTasks.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ------------------
  // VISTA DIARIA
  // ------------------
  const renderDayView = () => {
    const dateStr = selectedDate.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="day-view-container">
          <div className="day-view-header">
            <button onClick={() => setCurrentView('month')}>Volver al Mes</button>
            <h2>{dateStr}</h2>
          </div>

          <div className="slots-container">
            {timeSlots.map(slot => (
              <Droppable droppableId={slot.id} key={slot.id}>
                {(provided) => (
                  <div
                    className="slot-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="slot-header">
                      <i className="fa fa-clock-o slot-icon"></i>
                      <span>{slot.id}</span>
                    </div>
                    <div className="tasks-list">
                      {slot.tasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(providedDrag) => (
                            <div
                              className="task-card"
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              {...providedDrag.dragHandleProps}
                            >
                              <h4 className="task-title">{task.title}</h4>
                              <p className="task-category">{task.category}</p>
                              <p className="task-desc">{task.description}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
    );
  };

  // ------------------
  // RENDER PRINCIPAL
  // ------------------
  return (
    <div className="task-planner-container">
      {/* Barra superior */}
      <header className="top-bar">
        <div className="left-section">
          <i className="fa fa-user-circle user-icon" aria-hidden="true"></i>
        </div>
        <div className="center-section">
          <h1 className="title">PLANIFICADOR DE TAREAS</h1>
        </div>
        <div className="right-section">
          <i className="fa fa-bell bell-icon" aria-hidden="true"></i>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Botón para crear tarea */}
      <div className="create-task-bar">
        <button onClick={() => setShowCreateModal(true)} className="create-task-btn">
          <i className="fa fa-plus"></i> Nuevo
        </button>
      </div>

      {/* Contenido: vista mensual o vista diaria */}
      {currentView === 'month' ? renderMonthView() : renderDayView()}

      {/* Modal de creación de tarea */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Crear Nueva Tarea</h2>
            <form onSubmit={handleCreateTask} className="create-task-form">
              <label>Título</label>
              <input
                type="text"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                required
              />

              <label>Descripción</label>
              <textarea
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              />

              <label>Categoría</label>
              <select
                value={newTaskData.category}
                onChange={(e) => setNewTaskData({ ...newTaskData, category: e.target.value })}
              >
                <option value="Personal">Personal</option>
                <option value="Estudio">Estudio</option>
                <option value="Terapia">Terapia</option>
                <option value="Ocio">Ocio</option>
                <option value="Otro">Otro</option>
              </select>

              <label>Hora de inicio</label>
              <input
                type="datetime-local"
                value={newTaskData.startTime}
                onChange={(e) => setNewTaskData({ ...newTaskData, startTime: e.target.value })}
                required
              />

              <label>Hora de fin</label>
              <input
                type="datetime-local"
                value={newTaskData.endTime}
                onChange={(e) => setNewTaskData({ ...newTaskData, endTime: e.target.value })}
                required
              />

              <label>Recordatorio (opcional)</label>
              <input
                type="datetime-local"
                value={newTaskData.reminderTime}
                onChange={(e) => setNewTaskData({ ...newTaskData, reminderTime: e.target.value })}
              />

              <div className="modal-buttons">
                <button type="submit" className="save-btn">Guardar</button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pie de página */}
      <footer className="footer-bar">
        <p>© 2025. JANUS - Planificador de Tareas Avanzado</p>
      </footer>
    </div>
  );
}

export default TaskPlanner;
