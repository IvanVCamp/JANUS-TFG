// TaskPlanner.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/taskPlanner.css'; // CSS que definiremos abajo

function TaskPlanner() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]); 
  // Por ejemplo, cada slot es un objeto { id: '08:00', tasks: [array de tareas] }

  // Modal/Popup de creación de tarea
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    category: 'Personal',
    startTime: '',
    endTime: '',
    reminderTime: ''
  });

  // Cargar tareas desde el backend
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

  // Generar slots de 8:00 a 20:00, por ejemplo (puedes hacer un approach distinto)
  useEffect(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const label = `${String(hour).padStart(2, '0')}:00`;
      slots.push({ id: label, tasks: [] });
    }
    setTimeSlots(slots);
  }, []);

  // Cada vez que cambien tasks o timeSlots, reorganizamos las tasks en los slots
  useEffect(() => {
    if (!timeSlots.length) return;

    // Clonamos el array de slots vacíos
    const updatedSlots = timeSlots.map(slot => ({ ...slot, tasks: [] }));

    tasks.forEach(task => {
      // Suponemos que la hora de startTime define en qué slot está la tarea
      const taskHour = new Date(task.startTime).getHours(); 
      const slotId = `${String(taskHour).padStart(2, '0')}:00`;

      // Buscar slot en updatedSlots
      const slot = updatedSlots.find(s => s.id === slotId);
      if (slot) {
        slot.tasks.push(task);
      } else {
        // Si no encaja en ninguno, podrías ponerlo en un slot "Sin asignar" o similar
      }
    });

    setTimeSlots(updatedSlots);
  }, [tasks]);

  // Manejo del Drag & Drop
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return; // si se suelta fuera de un droppable

    // Si el usuario no cambió de slot, no hacemos nada
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    try {
      // Localizamos la tarea que se está arrastrando
      const task = tasks.find(t => t._id === draggableId);

      // Actualizamos su startTime al slot de destino
      const [destHour] = destination.droppableId.split(':'); 
      // Generar un new Date con la hora
      const newDate = new Date(task.startTime);
      newDate.setHours(parseInt(destHour, 10));
      newDate.setMinutes(0);

      const updatedTask = await taskService.updateTask(task._id, {
        startTime: newDate, 
        endTime: new Date(newDate.getTime() + 60 * 60 * 1000) // +1h, por ejemplo
      });

      // Actualizamos estado local
      setTasks(prev =>
        prev.map(t => (t._id === updatedTask._id ? updatedTask : t))
      );
    } catch (err) {
      console.error('Error actualizando tarea:', err);
    }
  };

  // Crear tarea
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const created = await taskService.createTask(newTaskData);
      setTasks(prev => [...prev, created]);
      setShowCreateModal(false);
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

  // Cerrar sesión
  const handleLogout = () => {
    // ...
    navigate('/');
  };

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

      {/* Botón para abrir modal de creación */}
      <div className="create-task-bar">
        <button onClick={() => setShowCreateModal(true)} className="create-task-btn">
          <i className="fa fa-plus"></i> Nueva Tarea
        </button>
      </div>

      {/* Contenedor principal con DragDropContext */}
      <DragDropContext onDragEnd={onDragEnd}>
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
      </DragDropContext>

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

      {/* Footer */}
      <footer className="footer-bar">
        <p>© 2025. JANUS - Planificador de Tareas Avanzado</p>
      </footer>
    </div>
  );
}

export default TaskPlanner;
