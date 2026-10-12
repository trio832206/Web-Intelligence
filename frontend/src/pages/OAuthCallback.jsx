import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function OAuthCallback({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError(`OAuth Error: ${urlError}`);
      return;
    }

    if (!token) {
      setError('No authentication token provided in OAuth response');
      return;
    }

    localStorage.setItem('webintel_token', token);

    // Fetch user details
    api.get('/api/v1/auth/me')
      .then(data => {
        if (data?.user) {
          localStorage.setItem('webintel_user', JSON.stringify(data.user));
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          } else {
            navigate('/');
          }
        } else {
          setError('Unable to retrieve user credentials');
        }
      })
      .catch(err => {
        setError(`Failed to establish session: ${err.message}`);
      });
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
        {error ? (
          <div>
            <AlertCircle size={40} color="var(--neon-red)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--neon-red)', marginBottom: '8px' }}>Authentication Failed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>{error}</p>
            <button onClick={() => navigate('/login')} className="cyber-btn cyber-btn-primary">
              Return to Login
            </button>
          </div>
        ) : (
          <div>
            <Loader2 size={40} color="var(--neon-accent)" className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Completing OAuth Sign In</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Validating token and initializing terminal session...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
