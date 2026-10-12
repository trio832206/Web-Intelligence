import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './context/ThemeContext';
import { 
  Shield, Activity, Search, Sparkles, BarChart3, Network, 
  Bell, KeyRound, Settings as SettingsIcon, LogOut, Moon, Sun, 
  Terminal, Globe, Menu, X
} from 'lucide-react';

import PortalBackground from './components/PortalBackground';
import CyberBootSequence from './components/CyberBootSequence';

import About from './pages/About';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import MachineLearning from './pages/MachineLearning';
import NLPAnalytics from './pages/NLPAnalytics';
import DataFusion from './pages/DataFusion';
import Alerts from './pages/Alerts';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import { api } from './utils/api';

export default function App() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, applyUserTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('webintel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isBooting, setIsBooting] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer when navigation occurs
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Initial user verification and theme sync
  useEffect(() => {
    const token = localStorage.getItem('webintel_token');
    if (token) {
      api.get('/api/v1/auth/me')
        .then(data => {
          if (data?.user) {
            setCurrentUser(data.user);
            localStorage.setItem('webintel_user', JSON.stringify(data.user));
            applyUserTheme(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('webintel_token');
          localStorage.removeItem('webintel_user');
          setCurrentUser(null);
        });
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setPendingUser(user);
    if (applyUserTheme) {
      applyUserTheme(user);
    }
    setIsBooting(true);
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    if (pendingUser) {
      setCurrentUser(pendingUser);
      if (applyUserTheme) {
        applyUserTheme(pendingUser);
      }
      setPendingUser(null);
    }
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('webintel_token');
    localStorage.removeItem('webintel_user');
    setCurrentUser(null);
    setShowLogoutModal(false);
    navigate('/login');
  };

  // Auth & public pages (no sidebar)
  const isAuthPage = ['/about', '/login', '/register', '/oauth/callback'].includes(location.pathname);

  // Require auth wrapper - redirect to /about first if not authenticated
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const token = localStorage.getItem('webintel_token');
    if (!token && !currentUser) {
      return <Navigate to="/about" replace />;
    }
    if (requireAdmin && currentUser?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // If booting, render exclusively the full-screen Cyber Boot Sequence
  // No login screen and no dashboard are visible in the background
  if (isBooting) {
    return <CyberBootSequence onComplete={handleBootComplete} currentUser={pendingUser || currentUser} />;
  }

  return (
    <div className="app-container">
      {/* Dynamic Digital Globe & Constellation Canvas */}
      <PortalBackground />

      {/* Global Scanline Filter */}
      <div className="scanline-overlay" />

      {/* Main Workspace (when not on auth/about pages) */}
      {!isAuthPage ? (
        <>
          {/* Mobile Drawer Overlay Backdrop */}
          {mobileMenuOpen && (
            <div 
              className="sidebar-backdrop" 
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Cyber Sidebar Navigation (Desktop Fixed + Mobile Slide Drawer) */}
          <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Brand */}
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="brand-icon">
                  <Shield size={20} />
                </div>
                <span className="brand-text">{t('nav.brand')}</span>
              </div>
              {/* Mobile Drawer Close Button */}
              <button 
                className="mobile-sidebar-close" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Search size={18} />
                <span className="nav-text">{t('nav.dashboard')}</span>
              </NavLink>

              <NavLink to="/synthesis" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Sparkles size={18} />
                <span className="nav-text">{t('nav.synthesis')}</span>
              </NavLink>

              <NavLink to="/nlp" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <BarChart3 size={18} />
                <span className="nav-text">{t('nav.nlp')}</span>
              </NavLink>

              <NavLink to="/data-fusion" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Network size={18} />
                <span className="nav-text">{t('nav.dataFusion')}</span>
              </NavLink>

              <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Bell size={18} />
                <span className="nav-text">{t('nav.alerts')}</span>
              </NavLink>

              {currentUser?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <Terminal size={18} />
                  <span className="nav-text">{t('nav.admin')}</span>
                </NavLink>
              )}

              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <SettingsIcon size={18} />
                <span className="nav-text">{t('nav.settings')}</span>
              </NavLink>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
              <div className="status-badge">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="radar-pulse" />
                  {t('nav.status')}
                </span>
                <span>24ms</span>
              </div>

              {currentUser && (
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="nav-link"
                  style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                >
                  <LogOut size={16} />
                  <span className="nav-text">{t('nav.logout')}</span>
                </button>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="main-viewport">
            {/* Top Bar */}
            <header className="top-bar">
              <div className="top-bar-left">
                {/* Mobile Hamburger Button */}
                <button 
                  className="mobile-hamburger-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  <Menu size={22} />
                </button>

                <span className="page-title-badge">
                  <Terminal size={18} color="var(--neon-accent)" />
                  <span className="page-title-text">WEB INTELLIGENCE SYSTEM TERMINAL</span>
                </span>
              </div>

              <div className="top-bar-right">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  title="Toggle Visual Mode"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* User Pill */}
                {currentUser && (
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glow)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="radar-pulse" />
                    <span className="user-email-pill" style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentUser.email}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Page Content Body */}
            <div className="content-body">
              <Routes>
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/synthesis" element={<ProtectedRoute><MachineLearning /></ProtectedRoute>} />
                <Route path="/nlp" element={<ProtectedRoute><NLPAnalytics /></ProtectedRoute>} />
                <Route path="/data-fusion" element={<ProtectedRoute><DataFusion /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel currentUser={currentUser} /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings currentUser={currentUser} onLogout={handleLogout} /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </>
      ) : (
        /* Standalone Auth & Public Routes (About, Login, Register, OAuthCallback) */
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/oauth/callback" element={<OAuthCallback onLoginSuccess={handleLoginSuccess} />} />
            <Route path="*" element={<Navigate to="/about" replace />} />
          </Routes>
        </main>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center' }}>
            <LogOut size={36} color="var(--neon-accent)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>{t('logout.confirm')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Your session credentials will be cleared from this terminal.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="cyber-btn cyber-btn-secondary"
              >
                {t('logout.no')}
              </button>
              <button
                onClick={handleLogout}
                className="cyber-btn cyber-btn-primary"
              >
                {t('logout.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
