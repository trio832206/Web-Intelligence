import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Globe, Shield, Terminal, Zap, Compass, CheckCircle2, 
  XCircle, Clock, Loader2, ArrowRight, ExternalLink, Play
} from 'lucide-react';
import { api } from '../utils/api';

export default function CrawlManager({ onCrawlCompleted }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'manual'
  const [prompt, setPrompt] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [urlCount, setUrlCount] = useState(5);
  const [depth, setDepth] = useState(1);
  const [location, setLocation] = useState('');
  const [locDetecting, setLocDetecting] = useState(false);
  const [strictRobots, setStrictRobots] = useState(false);
  const [useBrowser, setUseBrowser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);

  // Auto-detect location from timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
        setLocation('India');
      } else if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('America')) {
        setLocation('United States');
      } else if (tz.includes('London') || tz.includes('Europe')) {
        setLocation('United Kingdom');
      } else {
        setLocation(tz.split('/')[0] || 'Global');
      }
    } catch {
      setLocation('Global');
    }
  }, []);

  // Request browser geolocation permission
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const country = data.address?.country || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            setLocation(country);
          }
        } catch {
          setLocation('GPS Coordinates Locked');
        } finally {
          setLocDetecting(false);
        }
      },
      () => {
        setLocDetecting(false);
        alert('Geolocation permission was denied. You can manually enter your target region.');
      },
      { timeout: 8000 }
    );
  };

  // Keyboard shortcut Ctrl+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleDispatch();
    }
  };

  // Dispatch Crawl
  const handleDispatch = async () => {
    setError('');
    if (mode === 'prompt') {
      if (!prompt.trim()) {
        setError('Please enter a research prompt.');
        return;
      }

      setLoading(true);
      setCurrentStage(1);

      try {
        const data = await api.post('/api/v1/research/query', {
          prompt: prompt.trim(),
          max_urls: urlCount,
          depth,
          location
        });

        setActiveSession(data.session_id);
        setCurrentStage(2);
      } catch (err) {
        setError(err.message || 'Failed to dispatch research query');
        setLoading(false);
        setCurrentStage(0);
      }
    } else {
      // Manual Mode
      if (!manualUrl.trim() || !manualUrl.startsWith('http')) {
        setError('Please enter a valid URL starting with http:// or https://');
        return;
      }

      setLoading(true);
      try {
        await api.post('/api/v1/crawls', {
          url: manualUrl.trim(),
          depth,
          use_browser: useBrowser,
          strict_robots: strictRobots
        });

        setManualUrl('');
        alert('Manual target URL queued successfully for background execution.');
        if (onCrawlCompleted) onCrawlCompleted();
      } catch (err) {
        setError(err.message || 'Failed to queue crawl job');
      } finally {
        setLoading(false);
      }
    }
  };

  // Poll Session every 2.5s
  useEffect(() => {
    if (!activeSession) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await api.get(`/api/v1/research/session/${activeSession}`);
        if (data && data.summary) {
          setSessionData(data);

          const { completed, failed, total, running, done } = data.summary;

          if (running > 0) {
            setCurrentStage(3);
          } else if (completed > 0 && !done) {
            setCurrentStage(4);
          }

          if (done) {
            setCurrentStage(5);
            setLoading(false);
            clearInterval(pollInterval);
            if (onCrawlCompleted) onCrawlCompleted();
          }
        }
      } catch (err) {
        console.error('Session polling error:', err);
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [activeSession, onCrawlCompleted]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Selector: Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{t('crawler.title')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('crawler.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glow)' }}>
          <button
            onClick={() => setMode('prompt')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'prompt' ? 'var(--neon-cyan)' : 'transparent',
              color: mode === 'prompt' ? '#040914' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {t('crawler.promptMode')}
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'manual' ? 'var(--neon-cyan)' : 'transparent',
              color: mode === 'manual' ? '#040914' : 'var(--text-muted)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {t('crawler.manualMode')}
          </button>
        </div>
      </div>

      {/* Main Input Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {mode === 'prompt' ? (
          <div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('crawler.promptPlaceholder')}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'none',
                  transition: 'border 0.2s ease',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '16px',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {t('crawler.promptHint')}
              </span>
            </div>

            {/* Controls Bar: Quota, Location, Depth, Dispatch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* Quota Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('crawler.urlCountLabel')}</span>
                  {[3, 5, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setUrlCount(num)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: urlCount === num ? 'var(--neon-cyan)' : 'var(--border-glow)',
                        background: urlCount === num ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
                        color: urlCount === num ? 'var(--neon-accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Location Targeting */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} color="var(--neon-accent)" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. India, US"
                    style={{
                      width: '120px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-glow)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRequestGps}
                    disabled={locDetecting}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0, 240, 255, 0.08)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      color: 'var(--neon-cyan)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {locDetecting ? t('crawler.locationDetecting') : t('crawler.promptPermission')}
                  </button>
                </div>
              </div>

              {/* Dispatch Button */}
              <button
                type="button"
                onClick={handleDispatch}
                disabled={loading}
                className="cyber-btn cyber-btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('crawler.dispatching')}
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    {t('crawler.dispatchBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Manual Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder={t('crawler.targetUrlPlaceholder')}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleDispatch}
                disabled={loading}
                className="cyber-btn cyber-btn-primary"
              >
                <Play size={16} />
                {t('crawler.dispatchManualBtn')}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={strictRobots}
                  onChange={(e) => setStrictRobots(e.target.checked)}
                />
                {t('crawler.strictRobots')}
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useBrowser}
                  onChange={(e) => setUseBrowser(e.target.checked)}
                />
                {t('crawler.useBrowser')}
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('crawler.depthLabel')}</span>
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: depth === d ? 'var(--neon-cyan)' : 'var(--border-glow)',
                      background: depth === d ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                      color: depth === d ? 'var(--neon-cyan)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid rgba(255, 45, 85, 0.35)', color: '#ff5e7e', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* 5-Stage Pipeline Tracking */}
      {(loading || activeSession) && (
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="radar-pulse" />
              {t('crawler.activeSession')}: <code style={{ color: 'var(--neon-cyan)' }}>{activeSession}</code>
            </span>
            {sessionData && (
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)' }}>
                {sessionData.summary.completed}/{sessionData.summary.total} Targets Extracted
              </span>
            )}
          </div>

          <div className="pipeline-container">
            {[
              { id: 1, name: t('crawler.pipelineStage1') },
              { id: 2, name: t('crawler.pipelineStage2') },
              { id: 3, name: t('crawler.pipelineStage3') },
              { id: 4, name: t('crawler.pipelineStage4') },
              { id: 5, name: t('crawler.pipelineStage5') }
            ].map(stage => {
              const isCompleted = currentStage > stage.id || (sessionData?.summary.done && stage.id === 5);
              const isActive = currentStage === stage.id && !sessionData?.summary.done;

              return (
                <div key={stage.id} className="pipeline-stage">
                  <div className={`stage-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : stage.id}
                  </div>
                  <span className={`stage-label ${isActive ? 'active' : ''}`}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          {sessionData && (
            <div style={{ height: '6px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '3px', overflow: 'hidden', marginTop: '16px' }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                  width: `${(sessionData.summary.completed / Math.max(1, sessionData.summary.total)) * 100}%`,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Real-Time Session Crawl Jobs Table */}
      {sessionData && sessionData.jobs.length > 0 && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Crawl Targets & Output</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Session Prompt: "{sessionData.prompt}"
            </span>
          </div>

          <div className="table-responsive">
            <table className="cyber-table">
            <thead>
              <tr>
                <th>Target URL</th>
                <th>Crawl Engine</th>
                <th>Status</th>
                <th>Extracted Data</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.jobs.map(job => {
                const entity = sessionData.entities.find(e => e.job_id === job.id);
                const isStealth = /amazon|flipkart|myntra/i.test(job.url);

                return (
                  <tr key={job.id}>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {job.url}
                        <ExternalLink size={12} />
                      </a>
                    </td>
                    <td>
                      {isStealth ? (
                        <span className="badge badge-stealth">
                          <Shield size={12} />
                          {t('crawler.stealthBadge')}
                        </span>
                      ) : (
                        <span className="badge badge-direct">
                          <Zap size={12} />
                          {t('crawler.standardBadge')}
                        </span>
                      )}
                    </td>
                    <td>
                      {job.status === 'completed' && (
                        <span style={{ color: 'var(--neon-green)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                      {job.status === 'running' && (
                        <span style={{ color: 'var(--neon-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          <Loader2 size={14} className="animate-spin" /> Ingesting
                        </span>
                      )}
                      {job.status === 'pending' && (
                        <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          <Clock size={14} /> Queued
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span style={{ color: 'var(--neon-red)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          <XCircle size={14} /> {job.error_message || 'Blocked'}
                        </span>
                      )}
                    </td>
                    <td>
                      {entity ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)' }}>{entity.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {entity.content_snippet.slice(0, 110)}...
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Awaiting payload...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
