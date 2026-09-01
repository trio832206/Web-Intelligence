import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/register', {
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
        setError(data.detail || 'Registration failed');
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    }
  };
  return <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px'
  }}>
      <div className="palace-arch" style={{
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
        <h1 style={{
        fontSize: '2rem',
        marginBottom: '8px',
        textAlign: 'center'
      }}>Register</h1>
        <p style={{
        marginBottom: '32px',
        fontStyle: 'italic',
        color: 'var(--text)',
        textAlign: 'center'
      }}>
          Create a new account
        </p>

        <form onSubmit={handleRegister} style={{
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

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" style={{
          width: '100%',
          marginTop: '16px'
        }}>
            Sign Up
          </button>
        </form>
        
        {error && <p style={{
        color: 'var(--accent-light)',
        marginTop: '16px'
      }}>{error}</p>}
        {success && <p style={{
        color: 'green',
        marginTop: '16px'
      }}>{success}</p>}

        <p style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
          Already have an account? <Link to="/login" style={{
          color: 'var(--accent-light)',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>Login here</Link>
        </p>
      </div>
    </div>;
}