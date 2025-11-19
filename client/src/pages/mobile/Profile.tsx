import { User, MapPin, Calendar, Award, LogOut, Settings, HelpCircle } from 'lucide-react';

export default function ProfilePage() {
  const user = {
    name: 'Ahmed Benali',
    role: 'Merchandiser Senior',
    email: 'ahmed.benali@marjane.ma',
    phone: '+212 6 12 34 56 78',
    joinedDate: 'Janvier 2022',
    stats: {
      tasksCompleted: 247,
      photosUploaded: 1523,
      anomaliesReported: 89,
      storesVisited: 12,
    },
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Mon Profil
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Gérez vos informations et préférences
        </p>
      </header>

      {/* User Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}>
            AB
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {user.name}
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
              {user.role}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
              <Calendar size={14} />
              <span>Membre depuis {user.joinedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>
            {user.stats.tasksCompleted}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tâches complétées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.25rem' }}>
            {user.stats.photosUploaded}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Photos envoyées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.25rem' }}>
            {user.stats.anomaliesReported}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Anomalies signalées</div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.25rem' }}>
            {user.stats.storesVisited}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Magasins visités</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="#f59e0b" />
          Réalisations
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
          {[
            { icon: '🏆', label: '100 tâches', color: '#fbbf24' },
            { icon: '📸', label: '1000 photos', color: '#3b82f6' },
            { icon: '⭐', label: 'Top performer', color: '#f59e0b' },
            { icon: '🎯', label: 'Précision 95%', color: '#10b981' },
          ].map((achievement, i) => (
            <div 
              key={i}
              style={{
                minWidth: '100px',
                padding: '1rem',
                background: `${achievement.color}20`,
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{achievement.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: achievement.color }}>
                {achievement.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>
          Informations de contact
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={18} color="#64748b" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Email</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={18} color="#64748b" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Téléphone</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          cursor: 'pointer',
          border: 'none',
          textAlign: 'left',
          transition: 'transform 0.2s'
        }}>
          <Settings size={20} color="#64748b" />
          <span style={{ flex: 1, fontWeight: '500' }}>Paramètres</span>
          <span style={{ color: '#cbd5e1' }}>→</span>
        </button>

        <button className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          cursor: 'pointer',
          border: 'none',
          textAlign: 'left',
          transition: 'transform 0.2s'
        }}>
          <HelpCircle size={20} color="#64748b" />
          <span style={{ flex: 1, fontWeight: '500' }}>Aide et support</span>
          <span style={{ color: '#cbd5e1' }}>→</span>
        </button>
      </div>

      {/* Logout Button */}
      <button 
        className="btn btn-danger"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          marginBottom: '2rem'
        }}
      >
        <LogOut size={20} />
        Déconnexion
      </button>

      {/* App Version */}
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', paddingBottom: '1rem' }}>
        Marjane Terrain v1.0.0
      </div>
    </div>
  );
}
