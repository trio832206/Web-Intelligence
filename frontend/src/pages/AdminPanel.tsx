import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const endpoint = activeTab === 'users' ? '/api/v1/admin/users' : '/api/v1/admin/security-logs';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await res.json();
      if (activeTab === 'users') {
        setUsers(data);
      } else {
        setLogs(data);
      }
    } catch (err) {
      setError('Could not load data. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to delete user');
      }
      // Refresh user list
      fetchData();
    } catch (err) {
      alert('Could not delete user.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div className="dashboard-header" style={{ marginBottom: 0 }}>
        <h2>Admin Panel</h2>
        <p>Manage users and monitor system exploitation.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={18} /> User Management
        </button>
        <button 
          className={activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('security')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ShieldAlert size={18} /> Security & Exploitation Logs
        </button>
      </div>

      {/* Content */}
      <div className="carved-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        ) : activeTab === 'users' ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ opacity: 0.7, fontSize: '0.85rem' }}>{u.id}</td>
                    <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                    <td>
                      <span className={`status-badge ${u.is_admin ? 'status-completed' : 'status-running'}`}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                        disabled={u.is_admin}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event Type</th>
                  <th>Username</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ opacity: 0.7, fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span className="status-badge status-failed">
                        {log.event_type}
                      </span>
                    </td>
                    <td>{log.username || 'Unknown'}</td>
                    <td>{log.ip_address}</td>
                    <td>{log.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '32px' }}>
                      No exploitation attempts logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
