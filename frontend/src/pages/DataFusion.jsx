import React, { useState, useEffect } from 'react';
import { Network, CheckCircle, AlertTriangle } from 'lucide-react';
export default function DataFusion() {
  const [entities, setEntities] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/data/search').then(res => res.json()).then(data => {
      setEntities(data.results || []);
    }).catch(console.error);
  }, []);
  const handleSelect = id => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);else newSet.add(id);
    setSelectedIds(newSet);
  };
  const selectedEntities = entities.filter(e => selectedIds.has(e.id));

  // Generate dynamic mock data based on selection
  const resolutionData = selectedEntities.map((e, idx) => ({
    id: e.id,
    name: e.title.substring(0, 30) + '...',
    source1: new URL(e.url).hostname.replace('www.', ''),
    source2: idx % 2 === 0 ? 'Amazon' : 'BestBuy',
    confidence: Math.floor(Math.random() * 20) + 80,
    status: Math.random() > 0.5 ? 'Merged' : 'Pending Review'
  }));
  const brands = [...new Set(selectedEntities.map(e => new URL(e.url).hostname.replace('www.', '').split('.')[0].toUpperCase()))];
  const graphNodes = brands.map(brand => ({
    brand,
    type: 'Source/Brand',
    products: selectedEntities.filter(e => new URL(e.url).hostname.toUpperCase().includes(brand)).map(e => e.title.substring(0, 15) + '...')
  }));
  return <div>
      <div className="dashboard-header">
        <h2>Data Fusion Engine</h2>
        <p>Cross-source entity correlation, resolution, and knowledge graph mapping.</p>
      </div>

      <div style={{
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start'
    }}>
        
        {/* Left Column: Data Selection */}
        <div className="carved-panel" style={{
        flex: '0 0 350px',
        maxHeight: '700px',
        overflowY: 'auto'
      }}>
          <h3>Select Data Sources</h3>
          <p style={{
          opacity: 0.8,
          fontSize: '0.85rem',
          marginBottom: '16px'
        }}>Select extracted entities to fuse and analyze.</p>
          
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
            {entities.map(e => <label key={e.id} style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            background: 'var(--code-bg)',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: selectedIds.has(e.id) ? '1px solid var(--accent-base)' : '1px solid transparent'
          }}>
                <input type="checkbox" checked={selectedIds.has(e.id)} onChange={() => handleSelect(e.id)} style={{
              marginTop: '4px'
            }} />
                <div>
                  <div style={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                color: 'var(--text-h)'
              }}>{e.title}</div>
                  <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                wordBreak: 'break-all'
              }}>{e.url}</div>
                </div>
              </label>)}
            {entities.length === 0 && <p style={{
            opacity: 0.5
          }}>No data found.</p>}
          </div>
        </div>

        {/* Right Column: Dynamic Analysis */}
        <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
          
          {/* Knowledge Graph */}
          <div className="carved-panel">
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
              <Network className="icon" />
              <h3 style={{
              margin: 0
            }}>Semantic Knowledge Graph</h3>
            </div>
            {selectedEntities.length === 0 ? <p style={{
            opacity: 0.5
          }}>Please select data from the left panel to generate the graph.</p> : <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
                {graphNodes.map(node => <div key={node.brand} style={{
              background: 'var(--bg-card)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
                    <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                      <strong style={{
                  fontSize: '1.2rem',
                  color: 'var(--accent-light)'
                }}>{node.brand}</strong>
                      <span style={{
                  fontSize: '0.8rem',
                  background: 'var(--accent-base)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>{node.type}</span>
                    </div>
                    <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                      {node.products.map((p, i) => <div key={i} style={{
                  background: 'var(--code-bg)',
                  border: '1px solid var(--border)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: 'var(--text-h)'
                }}>
                          {p}
                        </div>)}
                    </div>
                  </div>)}
              </div>}
          </div>

          {/* Entity Resolution Engine */}
          <div className="carved-panel">
            <h3 style={{
            marginBottom: '16px'
          }}>Entity Resolution Engine</h3>
            {selectedEntities.length === 0 ? <p style={{
            opacity: 0.5
          }}>Please select data to simulate fuzzy matching.</p> : <div style={{
            overflowX: 'auto'
          }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entity Name</th>
                      <th>Sources Matched</th>
                      <th>Confidence</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolutionData.map(item => <tr key={item.id}>
                        <td style={{
                    fontWeight: '500'
                  }}>{item.name}</td>
                        <td style={{
                    fontSize: '0.85rem'
                  }}>{item.source1} ↔ {item.source2}</td>
                        <td>
                          <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                            <div style={{
                        width: '50px',
                        height: '6px',
                        background: 'var(--code-bg)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                              <div style={{
                          width: `${item.confidence}%`,
                          height: '100%',
                          background: item.confidence > 90 ? '#a3e635' : '#d4af37'
                        }}></div>
                            </div>
                            <span style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-h)'
                      }}>{item.confidence}%</span>
                          </div>
                        </td>
                        <td>
                          {item.status === 'Merged' ? <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#a3e635',
                      fontSize: '0.85rem'
                    }}>
                              <CheckCircle size={14} /> Merged
                            </span> : <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#d4af37',
                      fontSize: '0.85rem'
                    }}>
                              <AlertTriangle size={14} /> Review
                            </span>}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </div>

        </div>
      </div>
    </div>;
}