import { Link, useLocation } from 'wouter';
import { Home, Camera, CheckSquare, AlertCircle, User } from 'lucide-react';
import { useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  // Importer les styles mobiles
  useEffect(() => {
    import('../../mobile.css');
  }, []);

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#f8fafc' }}>
      {children}

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
