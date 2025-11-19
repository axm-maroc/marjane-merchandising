import { AlertTriangle, Plus, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

interface Anomaly {
  id: number;
  type: string;
  description: string;
  storeName: string;
  location: string;
  reportedAt: string;
  status: 'open' | 'resolved';
  severity: 'high' | 'medium' | 'low';
}

export default function AnomaliesPage() {
  const [showForm, setShowForm] = useState(false);
  const [anomalies] = useState<Anomaly[]>([
    {
      id: 1,
      type: 'Produit manquant',
      description: 'Coca-Cola 1.5L absent du rayon',
      storeName: 'Marjane Hay Riad',
      location: 'Rabat',
      reportedAt: '10:30',
      status: 'open',
      severity: 'high',
    },
    {
      id: 2,
      type: 'Produit mal placé',
      description: 'Pepsi dans la section Coca-Cola',
      storeName: 'Marjane Bouregreg',
      location: 'Rabat',
      reportedAt: '11:45',
      status: 'open',
      severity: 'medium',
    },
    {
      id: 3,
      type: 'Produit endommagé',
      description: 'Emballage déchiré sur jus d\'orange',
      storeName: 'Marjane Californie',
      location: 'Casablanca',
      reportedAt: 'Hier 16:20',
      status: 'resolved',
      severity: 'low',
    },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Urgent';
      case 'medium': return 'Normal';
      case 'low': return 'Faible';
      default: return '';
    }
  };

  const openAnomalies = anomalies.filter(a => a.status === 'open');

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Anomalies
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {openAnomalies.length} anomalie{openAnomalies.length > 1 ? 's' : ''} en cours
        </p>
      </header>

      {/* New Anomaly Button */}
      {!showForm && (
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} />
          Signaler une nouvelle anomalie
        </button>
      )}

      {/* New Anomaly Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fef3c7', border: '1px solid #fcd34d' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            Nouvelle anomalie
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Type d'anomalie
              </label>
              <select className="input">
                <option>Produit manquant</option>
                <option>Produit mal placé</option>
                <option>Produit en surplus</option>
                <option>Produit endommagé</option>
                <option>Autre</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="Décrivez l'anomalie..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Gravité
              </label>
              <select className="input">
                <option value="high">Urgent</option>
                <option value="medium">Normal</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  // Submit logic here
                  setShowForm(false);
                }}
              >
                Envoyer
              </button>
              <button 
                className="btn"
                style={{ 
                  flex: 1,
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

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
          Toutes ({anomalies.length})
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
          En cours ({openAnomalies.length})
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
          Résolues ({anomalies.filter(a => a.status === 'resolved').length})
        </button>
      </div>

      {/* Anomalies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {anomalies.map(anomaly => (
          <div 
            key={anomaly.id}
            className="card"
            style={{ 
              opacity: anomaly.status === 'resolved' ? 0.6 : 1,
              borderLeft: `4px solid ${getSeverityColor(anomaly.severity)}`
            }}
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.125rem 0.5rem', 
                  borderRadius: '9999px', 
                  background: `${getSeverityColor(anomaly.severity)}20`,
                  color: getSeverityColor(anomaly.severity),
                  fontWeight: '600'
                }}>
                  {getSeverityLabel(anomaly.severity)}
                </span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Clock size={12} />
                  {anomaly.reportedAt}
                </span>
                {anomaly.status === 'resolved' && (
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    Résolu
                  </span>
                )}
              </div>

              <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {anomaly.type}
              </h3>

              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {anomaly.description}
              </p>

              <div style={{ 
                fontSize: '0.875rem', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <MapPin size={14} />
                {anomaly.storeName} - {anomaly.location}
              </div>
            </div>

            {anomaly.status === 'open' && (
              <button 
                className="btn"
                style={{ 
                  fontSize: '0.875rem', 
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white'
                }}
              >
                Marquer comme résolu
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
