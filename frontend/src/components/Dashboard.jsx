import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, Database, CheckCircle, AlertTriangle, Download, 
  ExternalLink, CheckCircle2, XCircle, Clock, ShieldCheck, Cpu, Trash2
} from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Daily reset calculation: 04:00 AM
  const getResetCutoff = () => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(4, 0, 0, 0);

    // If current time is before 04:00 AM today, reset was yesterday at 04:00 AM
    if (now.getTime() < cutoff.getTime()) {
      cutoff.setDate(cutoff.getDate() - 1);
    }
    return cutoff;
  };

  const fetchData = async () => {
    try {
      const [crawlsData, searchData] = await Promise.all([
        api.get('/api/v1/crawls').catch(() => ({ jobs: [] })),
        api.get('/api/v1/data/search').catch(() => ({ entities: [] }))
      ]);

      if (crawlsData?.jobs) {
        setJobs(crawlsData.jobs);
      }

      if (searchData?.entities) {
        setEntities(searchData.entities);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter jobs by daily reset (after 04:00 AM)
  const resetCutoff = getResetCutoff();
  const recentJobs = jobs.filter(j => new Date(j.created_at).getTime() >= resetCutoff.getTime());

  // Metrics
  const activeStreams = recentJobs.filter(j => j.status === 'running' || j.status === 'pending').length;
  const completedJobs = recentJobs.filter(j => j.status === 'completed').length;
  const totalCompletedOrFailed = recentJobs.filter(j => j.status === 'completed' || j.status === 'failed').length;
  const successRate = totalCompletedOrFailed > 0 ? Math.round((completedJobs / totalCompletedOrFailed) * 100) : 100;
  const monitoredTargets = new Set(recentJobs.map(j => {
    try { return new URL(j.url).hostname; } catch { return j.url; }
  })).size;

  // Export CSV
  const handleExportCsv = () => {
    if (recentJobs.length === 0) return;

    const headers = ['Job ID', 'Target URL', 'Status', 'Depth', 'Diagnostics', 'Created At'];
    const rows = recentJobs.map(j => [
      `"${j.id}"`,
      `"${j.url}"`,
      `"${j.status}"`,
      j.depth,
      `"${(j.error_message || 'OK - Extracted').replace(/"/g, '""')}"`,
      `"${j.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `web_intelligence_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (recentJobs.length > 0 && selectedJobIds.size === recentJobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(recentJobs.map(j => j.id)));
    }
  };

  const toggleSelectJob = (id) => {
    setSelectedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedJobIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedJobIds.size} selected crawl operation(s)?`)) return;
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedJobIds);
      await api.delete('/api/v1/crawls', { job_ids: idsToDelete });
      setJobs(prev => prev.filter(j => !selectedJobIds.has(j.id)));
      setSelectedJobIds(new Set());
    } catch (err) {
      console.error('Failed to delete selected jobs:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (jobId) => {
    if (!window.confirm('Delete this crawl record?')) return;
    try {
      await api.delete(`/api/v1/crawls/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setSelectedJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete crawl job:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('dashboard.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('dashboard.subtitle')}</p>
      </div>

      {/* Real-Time System Health Card */}
      <div className="hud-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="radar-pulse" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
              {t('dashboard.hudTitle')}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> 04:00 AM Daily Reset Active
            </span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-accent)' }}>
              {t('dashboard.hudPing')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>{t('dashboard.kpiActive')}</span>
            <Activity size={18} color="var(--neon-accent)" />
          </div>
          <div className="kpi-value">{activeStreams}</div>
          <div className="kpi-sub">Real-time background crawler threads</div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>{t('dashboard.kpiEntities')}</span>
            <Database size={18} color="var(--neon-blue)" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--neon-blue)' }}>{entities.length}</div>
          <div className="kpi-sub">Stored in MongoDB Atlas cluster</div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>{t('dashboard.kpiSuccessRate')}</span>
            <CheckCircle size={18} color="var(--neon-green)" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--neon-green)' }}>{successRate}%</div>
          <div className="kpi-sub">Successful crawl operations and 200 OK responses</div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>{t('dashboard.kpiTargets')}</span>
            <Cpu size={18} color="var(--neon-amber)" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--neon-amber)' }}>{monitoredTargets}</div>
          <div className="kpi-sub">Distinct target host domains</div>
        </div>
      </div>

      {/* Recent Crawl Jobs Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('dashboard.recentJobs')}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing {recentJobs.length} operations processed since 04:00 AM cycle
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedJobIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="cyber-btn cyber-btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 16px', borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}
              >
                <Trash2 size={15} />
                Delete Selected ({selectedJobIds.size})
              </button>
            )}

            <button
              onClick={handleExportCsv}
              disabled={recentJobs.length === 0}
              className="cyber-btn cyber-btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <Download size={15} />
              {t('dashboard.exportCsv')}
            </button>
          </div>
        </div>

        {recentJobs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>{t('dashboard.noJobs')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={recentJobs.length > 0 && selectedJobIds.size === recentJobs.length}
                    onChange={toggleSelectAll}
                    title="Select all"
                    style={{ cursor: 'pointer', accentColor: 'var(--neon-accent)' }}
                  />
                </th>
                <th>{t('dashboard.targetUrl')}</th>
                <th>{t('dashboard.depth')}</th>
                <th>{t('dashboard.status')}</th>
                <th>{t('dashboard.diagnostics')}</th>
                <th>{t('dashboard.timestamp')}</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map(job => (
                <tr key={job.id} style={{ background: selectedJobIds.has(job.id) ? 'var(--neon-accent-dim)' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedJobIds.has(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--neon-accent)' }}
                    />
                  </td>
                  <td style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {job.url}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      D:{job.depth}
                    </span>
                  </td>
                  <td>
                    {job.status === 'completed' && (
                      <span className="badge badge-pos">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                    {job.status === 'running' && (
                      <span className="badge badge-direct">
                        <Clock size={12} /> Running
                      </span>
                    )}
                    {job.status === 'pending' && (
                      <span className="badge badge-neu">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="badge badge-neg">
                        <XCircle size={12} /> Failed
                      </span>
                    )}
                  </td>
                  <td>
                    {job.status === 'completed' ? (
                      <span style={{ color: 'var(--neon-green)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                        <CheckCircle2 size={14} /> Payload indexed
                      </span>
                    ) : job.error_message ? (
                      <span style={{ color: 'var(--neon-red)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                        {job.error_message}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Normal execution</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(job.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteSingle(job.id)}
                      title="Delete crawl record"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        color: 'var(--neon-red)',
                        border: '1px solid transparent',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--neon-red)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <Trash2 size={14} />
                    </button>
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
