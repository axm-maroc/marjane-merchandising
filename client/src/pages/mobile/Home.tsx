import { MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const stats = {
    tasksToday: 8,
    tasksCompleted: 5,
    anomaliesFound: 3,
    photosUploaded: 12,
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
          Marjane Terrain
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Application mobile pour merchandisers
        </p>
      </header>

      {/* User Info Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              Bonjour, Merchandiser
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              {currentTime.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Clock size={24} />
        </div>
        
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
            <MapPin size={16} />
            <span>Position: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
            {stats.tasksCompleted}/{stats.tasksToday}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tâches complétées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
            {stats.anomaliesFound}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Anomalies trouvées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
            {stats.photosUploaded}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Photos envoyées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
            {Math.round((stats.tasksCompleted / stats.tasksToday) * 100)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Progression</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Actions rapides
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a href="/tasks" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '12px' }}>
              <CheckCircle size={24} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Voir mes tâches</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {stats.tasksToday - stats.tasksCompleted} tâches restantes
              </div>
            </div>
            <span style={{ color: '#64748b' }}>→</span>
          </div>
        </a>

        <a href="/camera" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: '12px' }}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Prendre une photo</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Vérifier un planogramme
              </div>
            </div>
            <span style={{ color: '#64748b' }}>→</span>
          </div>
        </a>

        <a href="/anomalies" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '12px' }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Signaler une anomalie</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Remonter un problème terrain
              </div>
            </div>
            <span style={{ color: '#64748b' }}>→</span>
          </div>
        </a>
      </div>
    </div>
  );
}
