import { Route, Switch, Link, useLocation } from 'wouter';
import { Home, Camera, CheckSquare, AlertCircle, User } from 'lucide-react';
import HomePage from './pages/Home';
import TasksPage from './pages/Tasks';
import CameraPage from './pages/Camera';
import AnomaliesPage from './pages/Anomalies';
import ProfilePage from './pages/Profile';

function App() {
  const [location] = useLocation();

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/camera" component={CameraPage} />
        <Route path="/anomalies" component={AnomaliesPage} />
        <Route path="/profile" component={ProfilePage} />
      </Switch>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/" className={`bottom-nav-item ${location === '/' ? 'active' : ''}`}>
          <Home size={24} />
          <span>Accueil</span>
        </Link>
        <Link href="/tasks" className={`bottom-nav-item ${location === '/tasks' ? 'active' : ''}`}>
          <CheckSquare size={24} />
          <span>Tâches</span>
        </Link>
        <Link href="/camera" className={`bottom-nav-item ${location === '/camera' ? 'active' : ''}`}>
          <Camera size={24} />
          <span>Photo</span>
        </Link>
        <Link href="/anomalies" className={`bottom-nav-item ${location === '/anomalies' ? 'active' : ''}`}>
          <AlertCircle size={24} />
          <span>Anomalies</span>
        </Link>
        <Link href="/profile" className={`bottom-nav-item ${location === '/profile' ? 'active' : ''}`}>
          <User size={24} />
          <span>Profil</span>
        </Link>
      </nav>
    </div>
  );
}

export default App;
