import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/api/v1/auth/login', {
        email: email.trim(),
        password
      });

      localStorage.setItem('webintel_token', data.token);
      localStorage.setItem('webintel_user', JSON.stringify(data.user));
      
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication rejected');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = (window.location.hostname.includes('github.io') ? 'https://web-intelligence.onrender.com' : '') + '/api/v1/auth/oauth/google';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              background: 'var(--neon-accent-dim)',
              border: '1px solid var(--neon-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 20px var(--neon-accent-dim)'
            }}
          >
            <Shield size={28} color="var(--neon-accent)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em' }}>SYSTEM LOGIN</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            Enter your credentials to access Web Intelligence
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid rgba(255, 45, 85, 0.35)', borderRadius: '8px', color: '#ff5e7e', fontSize: '0.85rem', marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', top: '14px', left: '14px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', top: '14px', left: '14px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cyber-btn cyber-btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            {loading ? 'Verifying Credentials...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="cyber-btn cyber-btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
        >
          Sign in with Google OAuth 2.0
        </button>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link to="/about" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
            ← About System
          </Link>
          <span>•</span>
          <Link to="/register" style={{ color: 'var(--neon-accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
