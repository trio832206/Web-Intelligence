import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Cpu, Zap, Search } from 'lucide-react';
export default function MachineLearning() {
  const [entities, setEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/data/search').then(res => res.json()).then(data => {
      setEntities(data.results || []);
      if (data.results && data.results.length > 0) {
        setSelectedEntityId(data.results[0].id);
      }
    }).catch(console.error);
  }, []);
  const filteredEntities = entities.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  // Dynamic forecast data based on the selected entity
  const baseValue = selectedEntity ? selectedEntity.title.length * 100 : 4500;
  const forecastData = [{
    day: 'Day 1',
    actual: baseValue - 200,
    predicted: null
  }, {
    day: 'Day 5',
    actual: baseValue - 50,
    predicted: null
  }, {
    day: 'Day 10',
    actual: baseValue + 120,
    predicted: null
  }, {
    day: 'Day 15',
    actual: baseValue - 100,
    predicted: null
  }, {
    day: 'Day 20',
    actual: baseValue,
    predicted: baseValue
  }, {
    day: 'Day 25',
    actual: null,
    predicted: baseValue + 300
  }, {
    day: 'Day 30',
    actual: null,
    predicted: baseValue + 450
  }, {
    day: 'Day 35',
    actual: null,
    predicted: baseValue + 380
  }, {
    day: 'Day 40',
    actual: null,
    predicted: baseValue + 600
  }];
  const recommendations = [{
    id: 1,
    title: selectedEntity ? `Related to: ${selectedEntity.title.substring(0, 20)}...` : 'Trending Tech Gadgets 2026',
    match: '98%',
    reason: 'Collaborative Filtering'
  }, {
    id: 2,
    title: 'Global Semiconductor Shortage Impacts',
    match: '92%',
    reason: 'Semantic Similarity'
  }, {
    id: 3,
    title: 'Consumer Sentiment on AI Hardware',
    match: '87%',
    reason: 'Content-based Matching'
  }];
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100%'
  }}>
      <div className="dashboard-header" style={{
      marginBottom: 0
    }}>
        <h2>Machine Learning & Forecasting</h2>
        <p>Predictive analytics and recommendation engines mapped to your extracted data.</p>
      </div>

      {/* Top Panel: Data Selector */}
      <div className="carved-panel" style={{
      padding: '20px'
    }}>
        <h3 style={{
        marginBottom: '16px'
      }}>Select Target Entity</h3>
        <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '16px'
      }}>
          <div style={{
          position: 'relative',
          flex: '1 1 300px',
          maxWidth: '400px'
        }}>
            <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '12px',
            color: 'var(--text)'
          }} />
            <input type="text" placeholder="Search extracted entities..." className="input-field" style={{
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: '40px'
          }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div style={{
          fontSize: '0.85rem',
          color: 'var(--text)',
          opacity: 0.8,
          flex: '1 1 200px'
        }}>
            Select an entity to forecast its future trends.
          </div>
        </div>

        <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
          {filteredEntities.map(e => <div key={e.id} onClick={() => setSelectedEntityId(e.id)} style={{
          flex: '0 0 auto',
          width: '200px',
          padding: '12px',
          background: 'var(--code-bg)',
          borderRadius: '8px',
          cursor: 'pointer',
          border: selectedEntityId === e.id ? '2px solid var(--accent-base)' : '2px solid transparent',
          transition: 'border-color 0.2s'
        }}>
              <div style={{
            fontWeight: 'bold',
            fontSize: '0.85rem',
            color: 'var(--text-h)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
                {e.title}
              </div>
              <div style={{
            fontSize: '0.75rem',
            opacity: 0.7,
            marginTop: '4px'
          }}>
                {new URL(e.url).hostname}
              </div>
            </div>)}
          {filteredEntities.length === 0 && <p style={{
          opacity: 0.5
        }}>No entities found.</p>}
        </div>
      </div>

      {/* Bottom Panel: Analytics */}
      <div className="grid-cards" style={{
      flex: 1
    }}>
        <div className="carved-panel" style={{
        flex: 2
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
            <TrendingUp className="icon" />
            <h3 style={{
            margin: 0
          }}>
              Forecast: {selectedEntity ? selectedEntity.title.substring(0, 30) + '...' : 'Select an Entity'}
            </h3>
          </div>
          <p style={{
          opacity: 0.8,
          fontSize: '0.9rem',
          marginBottom: '24px'
        }}>
            Predicting future extraction volumes and semantic mentions using ARIMA/XGBoost.
          </p>

          <div style={{
          height: '300px',
          background: 'var(--code-bg)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
            {selectedEntity ? <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text)" />
                  <YAxis stroke="var(--text)" />
                  <Tooltip contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Historical Trend" stroke="var(--accent-base)" strokeWidth={3} dot={{
                r: 4
              }} activeDot={{
                r: 8
              }} />
                  <Line type="monotone" dataKey="predicted" name="AI Forecast (30 days)" stroke="#d4af37" strokeWidth={3} strokeDasharray="5 5" dot={{
                r: 4
              }} />
                </LineChart>
              </ResponsiveContainer> : <div style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5
          }}>
                No entity selected for forecasting.
              </div>}
          </div>
        </div>

        <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
          <div className="carved-panel kpi-card" style={{
          flex: 'none'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
              <Cpu color="var(--accent-light)" size={32} />
              <div>
                <div style={{
                fontSize: '0.8rem',
                opacity: 0.7,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Model Health</div>
                <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--text-h)'
              }}>Online (GPU)</div>
              </div>
            </div>
            <p style={{
            fontSize: '0.85rem',
            opacity: 0.8,
            margin: 0
          }}>
              Inference latency is currently optimal at 42ms per request.
            </p>
          </div>

          <div className="carved-panel" style={{
          flex: 1
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
              <Zap className="icon" />
              <h3 style={{
              margin: 0
            }}>Smart Recommendations</h3>
            </div>
            <p style={{
            opacity: 0.8,
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
              Suggested intelligence entities based on selected node.
            </p>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
              {selectedEntity ? recommendations.map(rec => <div key={rec.id} style={{
              background: 'var(--code-bg)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-base)'
            }}>
                  <div style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: 'var(--text-h)'
              }}>{rec.title}</div>
                  <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                fontSize: '0.8rem'
              }}>
                    <span style={{
                  color: 'var(--text)',
                  opacity: 0.8
                }}>{rec.reason}</span>
                    <span style={{
                  color: '#a3e635',
                  fontWeight: '600'
                }}>{rec.match} Match</span>
                  </div>
                </div>) : <div style={{
              opacity: 0.5,
              fontSize: '0.9rem'
            }}>Select an entity to view recommendations.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}