import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [fadingOut, setFadingOut] = useState(false);
  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Invalid credentials');
      } else {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);

        // Decode JWT payload to get is_admin
        try {
          const payloadBase64 = data.access_token.split('.')[1];
          const payload = JSON.parse(atob(payloadBase64));
          localStorage.setItem('isAdmin', payload.is_admin ? 'true' : 'false');
        } catch (e) {
          localStorage.setItem('isAdmin', 'false');
        }
        sessionStorage.removeItem('sessionStarted');
        window.dispatchEvent(new Event('authChange'));
        setFadingOut(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
  };
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    padding: '60px 20px 100px 20px',
    opacity: fadingOut ? 0 : 1,
    transition: 'opacity 0.8s ease',
    pointerEvents: fadingOut ? 'none' : 'auto',
    overflowY: 'auto'
  }}>
      <div style={{
      maxWidth: '600px',
      textAlign: 'center',
      marginBottom: '80px',
      marginTop: '10vh'
    }}>
        <h1 style={{
        fontSize: '3rem',
        marginBottom: '20px',
        color: 'var(--accent-light)'
      }}>Web Intelligence</h1>
        <p style={{
        fontSize: '1.2rem',
        lineHeight: '1.6',
        color: 'var(--text-h)'
      }}>
          Web Intelligence is an advanced platform designed to crawl, analyze, and synthesize data from the web.
          Powered by state-of-the-art NLP and machine learning, it extracts meaningful insights, monitors sentiment,
          and flags security events in real time. Scroll down to access your dashboard.
        </p>
      </div>

      <div className="palace-arch" style={{
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
        <h2 style={{
        fontSize: '1.8rem',
        marginBottom: '8px',
        textAlign: 'center'
      }}>Sign In</h2>
        <p style={{
        marginBottom: '32px',
        fontStyle: 'italic',
        color: 'var(--text)',
        textAlign: 'center'
      }}>
          Enter your credentials to access your account
        </p>

        <form onSubmit={handleLogin} style={{
        width: '100%'
      }}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" style={{
          width: '100%',
          marginTop: '16px'
        }}>
            Login
          </button>
        </form>
        
        {error && <p style={{
        color: 'var(--accent-light)',
        marginTop: '16px'
      }}>{error}</p>}

        <p style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
          Don't have an account? <Link to="/register" style={{
          color: 'var(--accent-light)',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>Register here</Link>
        </p>
      </div>
    </div>;
}