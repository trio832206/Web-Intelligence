import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ShieldAlert, Plus, Trash2, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';

export default function Alerts() {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [condition, setCondition] = useState('contains');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchAlerts = async () => {
    try {
      const data = await api.get('/api/v1/alerts');
      if (data) {
        setRules(data.rules || []);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setFeedback('');

    try {
      await api.post('/api/v1/alerts', {
        keyword: keyword.trim(),
        condition
      });

      setKeyword('');
      setFeedback('Alert rule saved and active.');
      fetchAlerts();
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await api.delete(`/api/v1/alerts/${ruleId}`);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('alerts.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('alerts.subtitle')}</p>
      </div>

      {feedback && (
        <div style={{ padding: '12px 16px', background: 'var(--neon-accent-dim)', border: '1px solid var(--neon-accent)', borderRadius: '8px', color: 'var(--neon-accent)', fontSize: '0.85rem' }}>
          {feedback}
        </div>
      )}

      {/* Grid: Create Alert Rule + Active Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Create Rule Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--neon-accent)" />
            {t('alerts.createRule')}
          </h3>

          <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Target Keyword</label>
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('alerts.keywordPlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <option value="contains">{t('alerts.conditionContains')}</option>
                <option value="sentiment_negative">{t('alerts.conditionNeg')}</option>
                <option value="sentiment_positive">{t('alerts.conditionPos')}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn cyber-btn-primary"
              style={{ marginTop: '8px' }}
            >
              <ShieldAlert size={16} />
              {t('alerts.saveRule')}
            </button>
          </form>
        </div>

        {/* Active Rules List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--neon-green)" />
            {t('alerts.activeRules')} ({rules.length})
          </h3>

          {rules.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', paddingTop: '12px' }}>
              No alert rules active. Configure an alert rule on the left.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {rules.map(rule => (
                <div
                  key={rule.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neon-accent)' }}>
                      "{rule.keyword}"
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Condition: <code style={{ color: 'var(--neon-amber)' }}>{rule.condition}</code>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                    title="Delete Rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Alerts Feed */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('alerts.notificationsFeed')}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time notifications triggered when crawled documents matched alert rules
          </span>
        </div>

        {notifications.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>Alert Event</th>
                <th>Target URL</th>
                <th>Triggered At</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7597', fontWeight: 500 }}>
                      <ShieldAlert size={16} />
                      {n.message}
                    </div>
                  </td>
                  <td style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                      {n.url}
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
