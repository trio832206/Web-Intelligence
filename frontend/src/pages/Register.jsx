import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Phone, Calendar, ArrowRight, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

const inputStyle = {
  width: '100%',
  padding: '12px 14px 12px 40px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-glow)',
  borderRadius: '8px',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  boxSizing: 'border-box',
};

const iconStyle = { position: 'absolute', top: '14px', left: '14px' };

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={16} color="var(--text-dim)" style={iconStyle} />
        {children}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!dob) {
      setError('Date of birth is required');
      return;
    }

    // Client-side age check (Must be >= 18)
    const dobDate = new Date(dob);
    const ageDiff = Date.now() - dobDate.getTime();
    const age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      setError('You must be at least 18 years old to use this application.');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', {
        email: email.trim(),
        password,
        date_of_birth: dob,
        phone: phone.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '36px', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '12px',
            background: 'var(--neon-accent-dim)', border: '1px solid var(--neon-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 20px var(--neon-accent-dim)',
          }}>
            <Shield size={28} color="var(--neon-accent)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            {submitted ? 'REQUEST SUBMITTED' : 'CREATE ACCOUNT'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            {submitted
              ? 'Your account is pending verification'
              : 'Users must be 18+ to access the Web Intelligence platform'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', background: 'rgba(255,45,85,0.15)',
            border: '1px solid rgba(255,45,85,0.35)', borderRadius: '8px',
            color: '#ff5e7e', fontSize: '0.85rem', marginBottom: '20px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success / Pending Verification Notice */}
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              padding: '18px', background: 'rgba(0, 255, 136, 0.08)',
              border: '1px solid var(--neon-accent)', borderRadius: '10px',
              textAlign: 'center', color: 'var(--text-main)'
            }}>
              <CheckCircle2 size={36} color="var(--neon-accent)" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--neon-accent)', marginBottom: '8px' }}>
                Application Received!
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                Your account will be verified and you will be able to login within <strong style={{ color: 'var(--text-main)' }}>24 hours</strong>.
              </p>
            </div>

            <div style={{
              padding: '16px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glow)', borderRadius: '10px',
              fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                <MessageSquare size={16} />
                <span>Need Support or Urgent Access?</span>
              </div>
              <p style={{ margin: 0 }}>
                For any issues faced or expedited verification, contact support on SMS or WhatsApp:
              </p>
              <div style={{
                marginTop: '10px', padding: '10px', background: 'var(--bg-input)',
                borderRadius: '6px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                fontSize: '1rem', fontWeight: 700, color: 'var(--neon-accent)',
                letterSpacing: '0.08em', border: '1px dashed var(--neon-accent)'
              }}>
                📱 7010371588 (SMS / WhatsApp)
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="cyber-btn cyber-btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '6px' }}
            >
              Back to Login
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Field label="Email Address" icon={Mail}>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>

            <Field label="Phone Number" icon={Phone}>
              <input
                type="tel" required value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
            </Field>

            <Field label="Date of Birth (Must be 18+)" icon={Calendar}>
              <input
                type="date" required value={dob}
                onChange={e => setDob(e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={inputStyle}
              />
            </Field>

            <Field label="Confirm Password" icon={Lock}>
              <input
                type="password" required value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </Field>

            <div style={{
              padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px',
              border: '1px solid var(--border-glow)', fontSize: '0.78rem', color: 'var(--text-dim)',
              lineHeight: '1.5'
            }}>
              ℹ️ After registering, your credentials will be submitted for administrative verification and activated within 24 hours.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn cyber-btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '4px' }}
            >
              {loading ? 'Submitting Registration...' : 'Register Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {!submitted && (
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--neon-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In Here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
