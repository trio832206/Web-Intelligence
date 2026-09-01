import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
export default function NLPAnalytics() {
  const [entities, setEntities] = useState([]);
  const {
    mode
  } = useTheme();
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/data/search').then(res => res.json()).then(data => setEntities(data.results || [])).catch(console.error);
  }, []);

  // Compute analytics
  const total = entities.length;
  const positive = entities.filter(e => e.sentiment_label === 'Positive').length;
  const negative = entities.filter(e => e.sentiment_label === 'Negative').length;
  const neutral = total - positive - negative;
  const sentimentData = [{
    name: 'Positive',
    value: positive,
    color: '#a3e635'
  }, {
    name: 'Neutral',
    value: neutral,
    color: '#d4af37'
  }, {
    name: 'Negative',
    value: negative,
    color: '#f87171'
  }].filter(d => d.value > 0);

  // Aggregate entities
  const entityCounts = {};
  entities.forEach(e => {
    if (e.named_entities) {
      try {
        const parsed = JSON.parse(e.named_entities);
        parsed.forEach(name => {
          entityCounts[name] = (entityCounts[name] || 0) + 1;
        });
      } catch (err) {}
    }
  });
  const topEntities = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({
    name,
    count
  }));
  return <div>
      <div className="dashboard-header">
        <h2>AI & NLP Insights</h2>
        <p>Deep semantic analysis of extracted web content</p>
      </div>

      <div className="grid-cards">
        <div className="carved-panel kpi-card">
          <h3>Sentiment Distribution</h3>
          {sentimentData.length > 0 ? <div style={{
          height: '250px',
          marginTop: '16px'
        }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
              }} />
                </PieChart>
              </ResponsiveContainer>
            </div> : <p style={{
          opacity: 0.7,
          marginTop: '20px'
        }}>No sentiment data available.</p>}
        </div>

        <div className="carved-panel kpi-card">
          <h3>Entity Frequency</h3>
          {topEntities.length > 0 ? <div style={{
          height: '250px',
          marginTop: '16px'
        }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEntities}>
                  <XAxis dataKey="name" stroke="var(--text)" fontSize={12} tickFormatter={val => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                  <YAxis stroke="var(--text)" />
                  <Tooltip contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
              }} />
                  <Bar dataKey="count" fill="var(--accent-base)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div> : <p style={{
          opacity: 0.7,
          marginTop: '20px'
        }}>No entities extracted yet.</p>}
        </div>
      </div>

      <div className="carved-panel" style={{
      marginTop: '24px'
    }}>
        <h3>Detailed Semantic Breakdown</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source Title</th>
                <th>Sentiment</th>
                <th>Structured Data</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(entity => {
              let parsedData = {};
              if (entity.structured_data) {
                try {
                  parsedData = JSON.parse(entity.structured_data);
                } catch (e) {}
              }
              return <tr key={entity.id}>
                    <td>
                      <a href={entity.url} target="_blank" rel="noreferrer" style={{
                    color: 'var(--text-h)',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}>
                        {entity.title}
                      </a>
                    </td>
                    <td>
                      {entity.sentiment_label ? <span className={`status-badge ${entity.sentiment_label === 'Positive' ? 'status-completed' : entity.sentiment_label === 'Negative' ? 'status-failed' : 'status-running'}`}>
                          {entity.sentiment_label} ({entity.sentiment_score?.toFixed(2)})
                        </span> : <span className="status-badge" style={{
                    opacity: 0.5
                  }}>Pending Analysis</span>}
                    </td>
                    <td>
                      <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                        {Object.entries(parsedData).map(([k, v]) => {
                      if (!v) return null;
                      return <span key={k} style={{
                        fontSize: '0.8rem',
                        background: 'var(--code-bg)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                              <strong style={{
                          color: 'var(--accent-light)'
                        }}>{k}:</strong> {v}
                            </span>;
                    })}
                      </div>
                    </td>
                  </tr>;
            })}
              {entities.length === 0 && <tr>
                  <td colSpan={3} style={{
                textAlign: 'center',
                opacity: 0.7
              }}>No semantic data available.</td>
                </tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
}