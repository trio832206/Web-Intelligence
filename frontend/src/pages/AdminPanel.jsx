import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, ShieldCheck, ShieldAlert, Trash2, Key, Activity, Clock, 
  UserCheck, UserX, Star, Phone, Calendar, Mail, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminPanel({ currentUser }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('pending'); // 'pending' | 'users' | 'logs'
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminData = async () => {
    setError('');
    try {
      const [pendingData, usersData, logsData] = await Promise.all([
        api.get('/api/v1/admin/pending-registrations'),
        api.get('/api/v1/admin/users'),
        api.get('/api/v1/admin/security-logs')
      ]);

      setPending(pendingData?.pending || []);
      setUsers(usersData?.users || []);
      setLogs(logsData?.logs || []);
    } catch (err) {
      setError(err.message || 'Access denied: Administrator privileges required');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveRegistration = async (pendingId, email) => {
    if (!window.confirm(`Confirm verification: Activate credentials and grant platform access to ${email}?`)) return;
    try {
      const res = await api.post(`/api/v1/admin/approve-registration/${pendingId}`);
      setSuccess(res.message || `User ${email} approved successfully.`);
      setError('');
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (pendingId, email) => {
    if (!window.confirm(`Reject and delete registration request for ${email}?`)) return;
    try {
      await api.post(`/api/v1/admin/reject-registration/${pendingId}`);
      setSuccess(`Registration for ${email} rejected.`);
      setError('');
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to reject registration');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      setSuccess('User deleted successfully.');
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleTogglePremium = async (userId, currentRole) => {
    const isCurrentlyPremium = currentRole === 'premium';
    const actionPrompt = isCurrentlyPremium 
      ? 'Revoke Premium access for this user?' 
      : 'Grant unlimited Premium access to this user?';
      
    if (!window.confirm(actionPrompt)) return;

    try {
      if (isCurrentlyPremium) {
        await api.post(`/api/v1/admin/approve-premium/${userId}`, { action: 'revoke' });
        setSuccess('Premium subscription revoked.');
      } else {
        await api.post(`/api/v1/admin/approve-premium/${userId}`);
        setSuccess('User upgraded to Premium successfully (Unlimited crawls enabled).');
      }
      setError('');
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to modify premium subscription');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('admin.title')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verify user requests within 24h, manage accounts, and assign Premium privileges
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
          {/* Pending Verifications Tab */}
          <button
            onClick={() => setTab('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'pending' ? 'var(--neon-accent)' : 'transparent',
              color: tab === 'pending' ? '#000000' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={14} />
            Pending Approval ({pending.length})
            {pending.length > 0 && (
              <span style={{
                background: tab === 'pending' ? '#000000' : 'var(--neon-accent)',
                color: tab === 'pending' ? 'var(--neon-accent)' : '#000000',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 800
              }}>
                NEW
              </span>
            )}
          </button>

          {/* Active Users Tab */}
          <button
            onClick={() => setTab('users')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'users' ? 'var(--neon-accent)' : 'transparent',
              color: tab === 'users' ? '#000000' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {t('admin.usersTab')} ({users.length})
          </button>

          {/* Security Logs Tab */}
          <button
            onClick={() => setTab('logs')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'logs' ? 'var(--neon-accent)' : 'transparent',
              color: tab === 'logs' ? '#000000' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {t('admin.logsTab')} ({logs.length})
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid var(--neon-red)', borderRadius: '8px', color: '#ff5e7e', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--neon-accent-dim)', border: '1px solid var(--neon-accent)', borderRadius: '8px', color: 'var(--neon-accent)', fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* ── TAB 1: PENDING REGISTRATIONS FOR ADMIN VERIFICATION ── */}
      {tab === 'pending' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-cyan)', margin: 0 }}>
                Pending User Verification Queue
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Credentials remain securely isolated until approved. Users are instructed their account will be active within 24 hours.
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '6px' }}>
              Support Contact: <strong>7010371588</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>Applicant Email</th>
                <th>Phone Number</th>
                <th>Date of Birth</th>
                <th>Submitted At</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No pending registration requests in queue. All user applications verified.
                  </td>
                </tr>
              ) : (
                pending.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} color="var(--neon-cyan)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <Phone size={14} color="var(--neon-accent)" />
                        <span>{p.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        <span>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveRegistration(p.id, p.email)}
                          className="cyber-btn"
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            background: 'rgba(0, 255, 136, 0.18)',
                            border: '1px solid var(--neon-accent)',
                            color: 'var(--neon-accent)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <UserCheck size={14} />
                          Confirm & Activate
                        </button>
                        <button
                          onClick={() => handleRejectRegistration(p.id, p.email)}
                          className="cyber-btn cyber-btn-danger"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <UserX size={14} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: REGISTERED USERS & PREMIUM MANAGEMENT ── */}
      {tab === 'users' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glow)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-cyan)', margin: 0 }}>
              Confirmed Platform Users & Premium Subscriptions
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Standard users: 10 prompt crawls/day. Premium users: Unlimited daily crawls.
            </p>
          </div>

          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>{t('admin.email')}</th>
                <th>Phone</th>
                <th>{t('admin.role')}</th>
                <th>Subscription Status</th>
                <th>{t('admin.created')}</th>
                <th>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.email}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    {u.phone || '—'}
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-stealth' : u.role === 'premium' ? 'badge-fusion' : 'badge-direct'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {u.role === 'premium' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--neon-accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill="var(--neon-accent)" />
                        {u.premium_expires_at ? `Exp: ${new Date(u.premium_expires_at).toLocaleDateString()}` : 'Unlimited (Active)'}
                      </span>
                    ) : u.role === 'admin' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>Administrator Access</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Standard (10/day)</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {u.id === currentUser?.id ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Active Session (Protected)</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleTogglePremium(u.id, u.role)}
                            className="cyber-btn"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              background: u.role === 'premium' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(0, 255, 136, 0.15)',
                              border: `1px solid ${u.role === 'premium' ? '#ffb800' : 'var(--neon-accent)'}`,
                              color: u.role === 'premium' ? '#ffb800' : 'var(--neon-accent)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Star size={12} fill={u.role === 'premium' ? '#ffb800' : 'none'} />
                            {u.role === 'premium' ? 'Revoke Premium' : '⭐ Grant Premium'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="cyber-btn cyber-btn-danger"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        >
                          <Trash2 size={12} />
                          {t('admin.delete')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY LOGS ── */}
      {tab === 'logs' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>{t('admin.eventType')}</th>
                <th>{t('admin.ip')}</th>
                <th>{t('admin.details')}</th>
                <th>{t('admin.timestamp')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    Perimeter clean. Zero security threat signatures intercepted.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ color: 'var(--neon-red)', fontWeight: 600, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={14} />
                        {log.event_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--neon-cyan)' }}>
                      {log.ip_address}
                    </td>
                    <td style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.details}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
