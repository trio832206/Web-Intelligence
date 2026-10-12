import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Globe, Shield, AlertTriangle, Trash2, Palette, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Settings({ currentUser, onLogout }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('webintel_lang', lang);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/api/v1/auth/delete-account');
      onLogout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    }
  };

  const languages = [
    { code: 'en', label: 'English (US)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' }
  ];

  const accents = [
    {
      id: 'green',
      name: 'Green Phosphor',
      code: theme === 'dark' ? '#00ff66' : '#047857',
      desc: 'Classic VT100 / Matrix phosphor terminal'
    },
    {
      id: 'cyan',
      name: 'Cyan Terminal',
      code: theme === 'dark' ? '#00f0ff' : '#0284c7',
      desc: 'High-contrast cyber telemetry cobalt'
    },
    {
      id: 'amber',
      name: 'Amber CRT',
      code: theme === 'dark' ? '#ffb000' : '#b45309',
      desc: 'Warm vintage cathode-ray tube amber'
    },
    {
      id: 'monochrome',
      name: 'Clean Monochrome',
      code: theme === 'dark' ? '#f8fafc' : '#0f172a',
      desc: 'Minimalist high-legibility terminal'
    },
    {
      id: 'crimson',
      name: 'Crimson Star',
      code: theme === 'dark' ? '#ff2a5f' : '#be123c',
      desc: 'High-intensity tactical crimson phosphor'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '840px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('settings.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('settings.subtitle')}</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid var(--neon-red)', borderRadius: '8px', color: '#ff5e7e', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Terminal Mode (Dark CRT vs White Paper Terminal) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {theme === 'dark' ? <Moon size={18} color="var(--neon-accent)" /> : <Sun size={18} color="var(--neon-accent)" />}
          {t('settings.theme')}
        </h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className="cyber-btn"
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '8px',
              background: theme === 'dark' ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
              border: `1px solid ${theme === 'dark' ? 'var(--neon-accent)' : 'var(--border-glow)'}`,
              color: theme === 'dark' ? 'var(--neon-accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Moon size={18} />
            {t('settings.darkCyber')}
          </button>

          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className="cyber-btn"
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '8px',
              background: theme === 'light' ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
              border: `1px solid ${theme === 'light' ? 'var(--neon-accent)' : 'var(--border-glow)'}`,
              color: theme === 'light' ? 'var(--neon-accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Sun size={18} />
            {t('settings.lightMatrix')}
          </button>
        </div>
      </div>

      {/* Terminal Accent Selector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={18} color="var(--neon-accent)" />
          {t('settings.accentTitle') || 'Terminal Text Accent'}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Choose your active terminal phosphor accent color for indicators, active tabs, buttons, and telemetry logs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {accents.map((item) => {
            const isSelected = accent === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAccent(item.id)}
                style={{
                  padding: '16px 14px',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
                  border: `1.5px solid ${isSelected ? item.code : 'var(--border-glow)'}`,
                  color: 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.code,
                        boxShadow: `0 0 8px ${item.code}`
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? item.code : 'var(--text-main)' }}>
                      {item.name}
                    </span>
                  </div>
                  {isSelected && <Check size={16} color={item.code} />}
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Localization Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--neon-green)" />
          {t('settings.language')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {languages.map(lang => {
            const isCurrent = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isCurrent ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
                  border: `1px solid ${isCurrent ? 'var(--neon-accent)' : 'var(--border-glow)'}`,
                  color: isCurrent ? 'var(--neon-accent)' : 'var(--text-main)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Profile Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--neon-blue)" />
          {t('settings.account')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>User Email</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{currentUser?.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255, 45, 85, 0.3)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px', color: '#ff5e7e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--neon-red)" />
          {t('settings.dangerZone')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Permanently delete your account and revoke all authentication tokens.
        </p>

        <button
          onClick={handleDeleteAccount}
          className="cyber-btn cyber-btn-danger"
          style={{ padding: '10px 20px', fontSize: '0.85rem' }}
        >
          <Trash2 size={16} />
          {t('settings.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
