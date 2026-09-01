import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import CrawlManager from './components/CrawlManager';
import PortalBackground from './components/PortalBackground';
import FloatingBayek from './components/FloatingBayek';
import NLPAnalytics from './pages/NLPAnalytics';
import Alerts from './pages/Alerts';
import DataFusion from './pages/DataFusion';
import MachineLearning from './pages/MachineLearning';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { useTheme } from './context/ThemeContext';
import { LayoutDashboard, Globe, Settings as SettingsIcon, LogOut, Brain, Bell, Share2, TrendingUp, Shield } from 'lucide-react';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  
  // introPlayed is true ONLY if sessionStarted is 'true' in sessionStorage (e.g. after refresh)
  const [introPlayed, setIntroPlayed] = useState(() => {
    return sessionStorage.getItem('sessionStarted') === 'true';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      // On login or logout, we want to reset the boot animation so it plays next time they enter the app
      setIntroPlayed(false);
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showIntro = !isAuthPage && !introPlayed;

  const handleIntroComplete = () => {
    setIntroPlayed(true);
    sessionStorage.setItem('sessionStarted', 'true');
  };

  const handleLogout = () => {
    setConfirmLogout(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('sessionStarted');
    window.dispatchEvent(new Event('authChange'));
    // React Router will navigate due to NavLink, but we can be explicit if we want.
  };

  return (
    <div className="app-container">
      {/* Intro background animation */}
      {showIntro && <PortalBackground onComplete={handleIntroComplete} />}

      {/* Main UI — hidden (opacity 0) until intro finishes */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          opacity: showIntro ? 0 : 1,
          transition: showIntro ? 'none' : (isAuthPage ? 'none' : 'opacity 1.8s ease'),
          pointerEvents: showIntro ? 'none' : 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {!isAuthPage && (
          <>
            <nav className="sidebar carved-panel">
              <div className="sidebar-header">
                <h1>Web Intelligence</h1>
              </div>

              <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              
              <NavLink to="/nlp-analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Brain size={20} /> AI & NLP Insights
              </NavLink>

              <NavLink to="/data-fusion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Share2 size={20} /> Data Fusion Engine
              </NavLink>

              <NavLink to="/ml-predictions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <TrendingUp size={20} /> Machine Learning
              </NavLink>

              <NavLink to="/alerts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Bell size={20} /> Alerts & Notifications
              </NavLink>

              <NavLink to="/crawler" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Globe size={20} /> New Crawl Job
              </NavLink>

              {localStorage.getItem('isAdmin') === 'true' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Shield size={20} /> Admin Panel
                </NavLink>
              )}

              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <SettingsIcon size={20} /> Settings
              </NavLink>

              <div style={{ flex: 1 }} />

              {confirmLogout ? (
                <div className="nav-item" style={{ marginTop: 'auto', marginBottom: '24px', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '0.9em', color: 'var(--text-h)' }}>Are you sure you want to logout?</span>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <NavLink to="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8em', flex: 1, textAlign: 'center' }} onClick={handleLogout}>
                      Yes
                    </NavLink>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8em', flex: 1 }} onClick={() => setConfirmLogout(false)}>
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="nav-item"
                  style={{ marginTop: 'auto', marginBottom: '24px' }}
                  onClick={() => setConfirmLogout(true)}
                >
                  <LogOut size={20} /> Logout
                </div>
              )}
            </nav>
            
            <FloatingBayek />
          </>
        )}

        <main 
          className={`main-content ${!isAuthPage ? 'dashboard-content' : 'auth-content'}`} 
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nlp-analytics" element={<NLPAnalytics />} />
            <Route path="/data-fusion" element={<DataFusion />} />
            <Route path="/ml-predictions" element={<MachineLearning />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/crawler" element={<CrawlManager />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={localStorage.getItem('isAdmin') === 'true' ? <AdminPanel /> : <Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
