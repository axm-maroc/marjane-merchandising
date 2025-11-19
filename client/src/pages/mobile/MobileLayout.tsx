import { Link, useLocation } from 'wouter';
import { Home, Camera, CheckSquare, AlertCircle, User, WifiOff, Wifi } from 'lucide-react';
import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { isOnline } = useServiceWorker();

  // Importer les styles mobiles
  useEffect(() => {
    import('../../mobile.css');
  }, []);

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Indicateur de connexion */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#f59e0b',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <WifiOff size={16} />
          Mode hors-ligne - Les données seront synchronisées à la reconnexion
        </div>
      )}
      
      <div style={{ paddingTop: !isOnline ? '40px' : '0' }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/mobile" className={`bottom-nav-item ${location === '/mobile' ? 'active' : ''}`}>
          <Home size={24} />
          <span>Accueil</span>
        </Link>
        <Link href="/mobile/tasks" className={`bottom-nav-item ${location === '/mobile/tasks' ? 'active' : ''}`}>
          <CheckSquare size={24} />
          <span>Tâches</span>
        </Link>
        <Link href="/mobile/camera" className={`bottom-nav-item ${location === '/mobile/camera' ? 'active' : ''}`}>
          <Camera size={24} />
          <span>Photo</span>
        </Link>
        <Link href="/mobile/anomalies" className={`bottom-nav-item ${location === '/mobile/anomalies' ? 'active' : ''}`}>
          <AlertCircle size={24} />
          <span>Anomalies</span>
        </Link>
        <Link href="/mobile/profile" className={`bottom-nav-item ${location === '/mobile/profile' ? 'active' : ''}`}>
          <User size={24} />
          <span>Profil</span>
        </Link>
      </nav>
    </div>
  );
}
