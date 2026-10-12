import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Network, CheckSquare, Square, Share2, Layers, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api, safeJsonParse } from '../utils/api';

export default function DataFusion() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [entities, setEntities] = useState([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState(new Set());
  const canvasRef = useRef(null);

  useEffect(() => {
    api.get('/api/v1/data/search')
      .then(data => {
        const list = data?.entities || [];
        setEntities(list);
        // Default select all
        setSelectedEntityIds(new Set(list.map(e => e.id)));
      })
      .catch(err => console.error('Data Fusion fetch error:', err));
  }, []);

  const toggleSelect = (id) => {
    const next = new Set(selectedEntityIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEntityIds(next);
  };

  const selectAll = () => {
    setSelectedEntityIds(new Set(entities.map(e => e.id)));
  };

  const clearAll = () => {
    setSelectedEntityIds(new Set());
  };

  // Cross-Entity Resolution Analysis
  const activeSources = entities.filter(e => selectedEntityIds.has(e.id));
  const entityToSourcesMap = new Map();

  for (const src of activeSources) {
    let list = src.named_entities;
    if (typeof list === 'string') {
      list = safeJsonParse(list, []);
    }
    if (!Array.isArray(list)) list = [];
    for (const ent of list) {
      if (!ent || typeof ent !== 'string') continue;
      if (!entityToSourcesMap.has(ent)) {
        entityToSourcesMap.set(ent, []);
      }
      entityToSourcesMap.get(ent).push({ title: src.title, url: src.url });
    }
  }

  // Entities shared across >= 2 sources (correlated)
  const resolvedEntities = Array.from(entityToSourcesMap.entries())
    .map(([name, srcs]) => ({ name, sources: srcs, count: srcs.length }))
    .sort((a, b) => b.count - a.count);

  // Render Interactive Knowledge Graph Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = 420);

    const isDark = theme === 'dark';
    const primaryColor = isDark ? '#00f0ff' : '#0077fe';
    const secondaryColor = isDark ? '#00ff9d' : '#059669';

    // Build Graph Nodes: Source Nodes & Top Entity Nodes
    const sourceNodes = activeSources.slice(0, 8).map((s, idx, arr) => {
      const angle = (idx / arr.length) * Math.PI * 2;
      const radius = 140;
      return {
        id: s.id,
        label: s.title.slice(0, 18) + '...',
        type: 'source',
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * (radius * 0.75),
        color: primaryColor,
        size: 9
      };
    });

    const topShared = resolvedEntities.slice(0, 6);
    const entityNodes = topShared.map((e, idx, arr) => {
      const angle = ((idx + 0.5) / Math.max(1, arr.length)) * Math.PI * 2;
      const radius = 60;
      return {
        id: e.name,
        label: e.name,
        type: 'entity',
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * (radius * 0.75),
        color: secondaryColor,
        size: 7 + Math.min(6, e.count * 2)
      };
    });

    let pulse = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      pulse += 0.03;

      // Draw Edges between Sources and Shared Entities
      ctx.lineWidth = 1;
      for (const sNode of sourceNodes) {
        const srcObj = activeSources.find(s => s.id === sNode.id);
        const srcEntities = new Set(srcObj?.named_entities || []);

        for (const eNode of entityNodes) {
          if (srcEntities.has(eNode.id)) {
            ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 114, 255, 0.25)';
            ctx.beginPath();
            ctx.moveTo(sNode.x, sNode.y);
            ctx.lineTo(eNode.x, eNode.y);
            ctx.stroke();
          }
        }
      }

      // Draw Entity Nodes (Center Group)
      for (const node of entityNodes) {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + Math.sin(pulse) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = '600 11px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size + 14);
      }

      // Draw Source Nodes (Outer Ring)
      for (const node of sourceNodes) {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#8b9bb4' : '#475569';
        ctx.font = '500 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - 12);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [activeSources, resolvedEntities, theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('dataFusion.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('dataFusion.subtitle')}</p>
      </div>

      {/* Main Grid: Source Selector + Interactive Knowledge Graph */}
      <div className="data-fusion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Source Selector Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('dataFusion.selectSources')}</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={selectAll} className="cyber-btn cyber-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                All
              </button>
              <button onClick={clearAll} className="cyber-btn cyber-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                Clear
              </button>
            </div>
          </div>

          {entities.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>No sources available. Run a crawl first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {entities.map(e => {
                const isChecked = selectedEntityIds.has(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => toggleSelect(e.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isChecked ? 'var(--neon-accent-dim)' : 'var(--bg-card)',
                      border: '1px solid',
                      borderColor: isChecked ? 'var(--neon-accent)' : 'var(--border-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {isChecked ? <CheckSquare size={16} color="var(--neon-accent)" /> : <Square size={16} color="var(--text-dim)" />}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {Array.isArray(e.named_entities) ? e.named_entities.length : 0} entities
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Knowledge Graph Canvas */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={18} color="var(--neon-cyan)" />
              {t('dataFusion.graphView')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Cyan = Sources · Green = Shared Cross-Entity Nodes
            </span>
          </div>

          <div style={{ width: '100%', height: '420px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-glow)', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Cross-Entity Resolution Matrix */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('dataFusion.entityResolution')}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing named entities correlated across multiple crawled domains
          </span>
        </div>

        {resolvedEntities.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            No multi-source entities correlated yet. Select multiple sources above.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>{t('dataFusion.entityName')}</th>
                <th>{t('dataFusion.sourceCount')}</th>
                <th>{t('dataFusion.associatedUrls')}</th>
              </tr>
            </thead>
            <tbody>
              {resolvedEntities.map(ent => (
                <tr key={ent.name}>
                  <td>
                    <span className="entity-pill" style={{ fontSize: '0.84rem', padding: '4px 10px', fontWeight: 600 }}>
                      {ent.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: ent.count > 1 ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                      {ent.count} sources
                    </span>
                  </td>
                  <td style={{ maxWidth: '400px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {ent.sources.slice(0, 3).map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        >
                          {s.title} ({s.url.slice(0, 36)}...)
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
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
