import { useState, useEffect } from 'react';

export default function Alerts() {
  const [rules, setRules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sentimentThreshold, setSentimentThreshold] = useState('');

  const fetchAlerts = () => {
    fetch('http://localhost:8000/api/v1/alerts')
      .then(res => res.json())
      .then(data => {
        setRules(data.rules || []);
        setNotifications(data.notifications || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    await fetch('http://localhost:8000/api/v1/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, keyword, sentiment_threshold: sentimentThreshold || null })
    });
    setName('');
    setKeyword('');
    setSentimentThreshold('');
    fetchAlerts();
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>Alert & Notification System</h2>
        <p>Monitor data streams for specific triggers</p>
      </div>

      <div className="grid-cards">
        <div className="carved-panel" style={{ flex: 1 }}>
          <h3>Create New Alert Rule</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Rule Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Keyword Trigger (optional)</label>
              <input type="text" className="input-field" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Apple" />
            </div>
            <div className="input-group">
              <label>Sentiment Trigger (optional)</label>
              <select className="input-field" value={sentimentThreshold} onChange={e => setSentimentThreshold(e.target.value)}>
                <option value="">Any</option>
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Rule</button>
          </form>

          <h3 style={{ marginTop: '24px' }}>Active Rules</h3>
          <ul>
            {rules.map(r => (
              <li key={r.id} style={{ color: 'var(--text)', marginBottom: '8px', background: 'var(--code-bg)', padding: '8px', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--accent-light)' }}>{r.name}</strong><br/>
                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {r.keyword && `Keyword: "${r.keyword}" `}
                  {r.sentiment_threshold && `| Sentiment: ${r.sentiment_threshold}`}
                </span>
              </li>
            ))}
            {rules.length === 0 && <li style={{ opacity: 0.7 }}>No rules active.</li>}
          </ul>
        </div>

        <div className="carved-panel" style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
          <h3>Recent Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent-base)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{n.message}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.8, marginTop: '4px' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p style={{ opacity: 0.7 }}>No notifications yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
