import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Royal Chambers</h2>
      </div>

      <div className="grid-cards">
        <div className="carved-panel">
          <h3 style={{ marginBottom: '24px' }}>Ambiance (Theme)</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>Daylight</span>
            
            {/* Custom Toggle Switch */}
            <div 
              style={{
                width: '60px',
                height: '30px',
                background: 'var(--border)',
                borderRadius: '15px',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-inset)'
              }}
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            >
              <div 
                style={{
                  width: '26px',
                  height: '26px',
                  background: 'var(--bg)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: mode === 'light' ? '2px' : '32px',
                  transition: 'left 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </div>
            
            <span style={{ color: 'var(--text-h)', fontWeight: 'bold' }}>Midnight</span>
          </div>
        </div>

        <div className="carved-panel">
          <h3 style={{ marginBottom: '24px' }}>Royal Accents</h3>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'teal', color: '#14b8a6', label: 'Mysore Teal' },
              { id: 'red', color: '#e11d48', label: 'Crimson Red' },
              { id: 'black-opal', color: '#1e1b4b', label: 'Black Opal' },
              { id: 'sapphire', color: '#3b82f6', label: 'Ceylon Sapphire' },
              { id: 'amethyst', color: '#a855f7', label: 'Deep Amethyst' },
              { id: 'emerald', color: '#10b981', label: 'Imperial Emerald' },
            ].map(swatch => (
              <div 
                key={swatch.id}
                title={swatch.label}
                onClick={() => setAccent(swatch.id as any)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: swatch.color,
                  cursor: 'pointer',
                  border: accent === swatch.id ? '3px solid var(--text-h)' : '2px solid var(--border)',
                  boxShadow: accent === swatch.id ? '0 0 10px var(--text-h)' : 'var(--shadow-outset)',
                  transform: accent === swatch.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        <div className="carved-panel">
          <h3 style={{ marginBottom: '24px' }}>Account Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              className="btn-danger" 
              style={{ width: 'fit-content' }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="carved-panel" style={{ width: '450px', maxWidth: '90%', textAlign: 'center', padding: '32px' }}>
            <h3 style={{ color: 'var(--danger)', marginTop: 0, fontSize: '1.5rem' }}>Delete Account</h3>
            <p style={{ margin: '16px 0 32px 0', fontSize: '1.1rem', color: 'var(--text)' }}>
              Are you absolutely sure? This action cannot be undone and you will lose all your data.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                className="btn-danger" 
                style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)', flex: 1 }}
                onClick={() => {
                  alert('Account deletion logic would go here.');
                  setConfirmDelete(false);
                }}
              >
                Yes, delete my account
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
