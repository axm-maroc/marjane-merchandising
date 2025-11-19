import { CheckCircle, Circle, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: number;
  storeName: string;
  location: string;
  planogramName: string;
  dueTime: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      storeName: 'Marjane Hay Riad',
      location: 'Rabat',
      planogramName: 'Rayon Boissons - Coca-Cola',
      dueTime: '10:00',
      completed: true,
      priority: 'high',
    },
    {
      id: 2,
      storeName: 'Marjane Bouregreg',
      location: 'Rabat',
      planogramName: 'Rayon Snacks',
      dueTime: '11:30',
      completed: true,
      priority: 'medium',
    },
    {
      id: 3,
      storeName: 'Marjane Californie',
      location: 'Casablanca',
      planogramName: 'Rayon Boissons - Jus',
      dueTime: '14:00',
      completed: false,
      priority: 'high',
    },
    {
      id: 4,
      storeName: 'Marjane Derb Sultan',
      location: 'Casablanca',
      planogramName: 'Rayon Eaux minérales',
      dueTime: '15:30',
      completed: false,
      priority: 'medium',
    },
    {
      id: 5,
      storeName: 'Marjane Hay Riad',
      location: 'Rabat',
      planogramName: 'Rayon Produits laitiers',
      dueTime: '16:00',
      completed: false,
      priority: 'low',
    },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Normal';
      case 'low': return 'Faible';
      default: return '';
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Mes Tâches
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {completedCount} sur {tasks.length} tâches complétées
        </p>
      </header>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          height: '8px', 
          background: '#e2e8f0', 
          borderRadius: '9999px', 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            height: '100%', 
            width: `${(completedCount / tasks.length) * 100}%`, 
            background: 'linear-gradient(90deg, #10b981, #059669)', 
            transition: 'width 0.3s' 
          }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button className="btn" style={{ 
          padding: '0.5rem 1rem', 
          background: '#10b981', 
          color: 'white', 
          fontSize: '0.875rem',
          width: 'auto',
          whiteSpace: 'nowrap'
        }}>
          Toutes ({tasks.length})
        </button>
        <button className="btn" style={{ 
          padding: '0.5rem 1rem', 
          background: 'white', 
          color: '#64748b', 
          fontSize: '0.875rem',
          border: '1px solid #e2e8f0',
          width: 'auto',
          whiteSpace: 'nowrap'
        }}>
          En cours ({tasks.filter(t => !t.completed).length})
        </button>
        <button className="btn" style={{ 
          padding: '0.5rem 1rem', 
          background: 'white', 
          color: '#64748b', 
          fontSize: '0.875rem',
          border: '1px solid #e2e8f0',
          width: 'auto',
          whiteSpace: 'nowrap'
        }}>
          Terminées ({completedCount})
        </button>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="card" 
            style={{ 
              opacity: task.completed ? 0.6 : 1,
              borderLeft: `4px solid ${getPriorityColor(task.priority)}`
            }}
          >
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => toggleTask(task.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer',
                  color: task.completed ? '#10b981' : '#cbd5e1'
                }}
              >
                {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem' 
                }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.125rem 0.5rem', 
                    borderRadius: '9999px', 
                    background: `${getPriorityColor(task.priority)}20`,
                    color: getPriorityColor(task.priority),
                    fontWeight: '600'
                  }}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Clock size={12} />
                    {task.dueTime}
                  </span>
                </div>

                <h3 style={{ 
                  fontWeight: '600', 
                  marginBottom: '0.25rem',
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                  {task.planogramName}
                </h3>

                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <MapPin size={14} />
                  {task.storeName} - {task.location}
                </div>
              </div>
            </div>

            {!task.completed && (
              <div style={{ 
                marginTop: '1rem', 
                display: 'flex', 
                gap: '0.5rem' 
              }}>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem 1rem',
                    flex: 1
                  }}
                  onClick={() => window.location.href = '/mobile/camera'}
                >
                  Prendre une photo
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem 1rem',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    flex: 1
                  }}
                  onClick={() => toggleTask(task.id)}
                >
                  Marquer comme fait
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
