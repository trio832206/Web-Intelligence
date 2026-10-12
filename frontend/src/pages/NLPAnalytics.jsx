import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Tag, ExternalLink, Activity, Sparkles } from 'lucide-react';
import { api, safeJsonParse } from '../utils/api';

export default function NLPAnalytics() {
  const { t } = useTranslation();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/data/search')
      .then(data => {
        setEntities(data?.entities || []);
      })
      .catch(err => console.error('NLP fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Compute Top 10 Named Entities across all crawled entities
  const entityFreqMap = new Map();
  for (const item of entities) {
    let list = item.named_entities;
    if (typeof list === 'string') {
      list = safeJsonParse(list, []);
    }
    if (!Array.isArray(list)) list = [];
    for (const token of list) {
      if (token && typeof token === 'string') {
        entityFreqMap.set(token, (entityFreqMap.get(token) || 0) + 1);
      }
    }
  }

  const top10Entities = Array.from(entityFreqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxFreq = top10Entities.length > 0 ? top10Entities[0][1] : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('nlp.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('nlp.subtitle')}</p>
      </div>

      {/* Top 10 Named Entities Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={20} color="var(--neon-cyan)" />
          {t('nlp.topEntities')}
        </h3>

        {top10Entities.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('nlp.noData')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {top10Entities.map(([name, count]) => {
              const widthPct = Math.max(8, (count / maxFreq) * 100);
              return (
                <div key={name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>

                  {/* Frequency Bar */}
                  <div style={{ height: '14px', background: 'rgba(8, 16, 32, 0.7)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-glow)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))',
                        borderRadius: '7px',
                        boxShadow: '0 0 10px rgba(0, 240, 255, 0.35)',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>

                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--neon-cyan)', textAlign: 'right' }}>
                    {count} occ
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-Page Sentiment & Entity Breakdown Matrix */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('nlp.sentimentBreakdown')}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing linguistic polarity and extracted NER tags for {entities.length} indexed documents
          </span>
        </div>

        {entities.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>{t('nlp.noData')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>{t('nlp.pageTitle')}</th>
                <th>{t('nlp.sentimentScore')}</th>
                <th>{t('nlp.sentimentLabel')}</th>
                <th>{t('nlp.entitiesFound')}</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(e => (
                <tr key={e.id}>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>{e.title}</div>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontFamily: 'var(--font-mono)' }}
                    >
                      {e.url.slice(0, 48)}...
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Mini Score Gauge */}
                      <div style={{ width: '60px', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(10, ((e.sentiment_score + 1) / 2) * 100))}%`,
                            background: e.sentiment_score >= 0.05 ? 'var(--neon-green)' : e.sentiment_score <= -0.05 ? 'var(--neon-red)' : 'var(--text-muted)'
                          }}
                        />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {e.sentiment_score > 0 ? `+${e.sentiment_score}` : e.sentiment_score}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${e.sentiment_label === 'Positive' ? 'badge-pos' : e.sentiment_label === 'Negative' ? 'badge-neg' : 'badge-neu'}`}>
                      {e.sentiment_label}
                    </span>
                  </td>
                  <td style={{ maxWidth: '340px' }}>
                    {Array.isArray(e.named_entities) && e.named_entities.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {e.named_entities.slice(0, 6).map(ent => (
                          <span key={ent} className="entity-pill">
                            {ent}
                          </span>
                        ))}
                        {e.named_entities.length > 6 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                            +{e.named_entities.length - 6} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>None identified</span>
                    )}
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
