import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Folder, FolderOpen, ChevronRight, CheckSquare, Square, 
  Trash2, Sparkles, AlertCircle, FileText, CheckCircle2, 
  Clock, Tag, BarChart2, ShieldAlert, Eye, X
} from 'lucide-react';
import { api } from '../utils/api';

export default function MachineLearning() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [currentSessionDetails, setCurrentSessionDetails] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());
  
  // Synthesis state
  const [synthesisQuery, setSynthesisQuery] = useState('');
  const [synthesizedResult, setSynthesizedResult] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);

  // Approach D: Payload Inspection Modal state
  const [inspectingJobId, setInspectingJobId] = useState(null);
  const [payloadData, setPayloadData] = useState(null);
  const [loadingPayload, setLoadingPayload] = useState(false);

  // Bulk delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleInspectPayload = async (jobId) => {
    setInspectingJobId(jobId);
    setLoadingPayload(true);
    setPayloadData(null);
    try {
      const data = await api.get(`/api/v1/crawls/${jobId}/payload`);
      setPayloadData(data);
    } catch (err) {
      setPayloadData({ error: err.message });
    } finally {
      setLoadingPayload(false);
    }
  };

  // Fetch sessions archive
  const fetchSessions = async () => {
    try {
      const data = await api.get('/api/v1/research/sessions');
      if (data?.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !selectedSessionId) {
          loadSession(data.sessions[0].session_id);
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Load a session's jobs & entities
  const loadSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setSynthesizedResult(null);
    try {
      const data = await api.get(`/api/v1/research/session/${sessionId}`);
      if (data && data.jobs) {
        setCurrentSessionDetails(data);
        // Default select all jobs in this session
        const allIds = new Set(data.jobs.map(j => j.id));
        setSelectedJobIds(allIds);
        setSynthesisQuery(data.prompt || '');
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  // Toggle selection
  const toggleJobSelect = (id) => {
    const next = new Set(selectedJobIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedJobIds(next);
  };

  const handleSelectAll = () => {
    if (!currentSessionDetails) return;
    setSelectedJobIds(new Set(currentSessionDetails.jobs.map(j => j.id)));
  };

  const handleClearAll = () => {
    setSelectedJobIds(new Set());
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) return;
    setDeleting(true);
    try {
      const data = await api.delete('/api/v1/research/sessions/crawls', {
        job_ids: Array.from(selectedJobIds)
      });

      setFeedback(`Purged ${data.deleted_jobs_count || 0} crawl records and ${data.deleted_entities_count || 0} intelligence payloads.`);
      setShowDeleteModal(false);
      
      // Reload sessions
      await fetchSessions();
      if (selectedSessionId) {
        await loadSession(selectedSessionId);
      }
    } catch (err) {
      setFeedback(`Delete error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Perform Real Cross-Source Synthesis with Inquiry Matching
  const handleSynthesize = async () => {
    if (!currentSessionDetails || selectedJobIds.size === 0) return;
    setSynthesizing(true);
    setSynthesizedResult(null);

    try {
      const data = await api.post('/api/v1/research/synthesize', {
        job_ids: Array.from(selectedJobIds),
        inquiry: synthesisQuery.trim()
      });
      setSynthesizedResult(data);
    } catch (err) {
      console.error('Synthesis failed:', err);
      setSynthesizedResult({
        matched: false,
        message: "The inquiry didn't match any selected resources",
        reason: err.message || 'Error occurred while analyzing selected resources.',
        inquiry: synthesisQuery.trim()
      });
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('synthesis.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('synthesis.subtitle')}</p>
      </div>

      {feedback && (
        <div style={{ padding: '12px 16px', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--neon-cyan)', borderRadius: '8px', color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>
          {feedback}
        </div>
      )}

      {/* Main Grid: Sessions Tree (Left) + Source Selector & Synthesis Workbench (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Folder-like Session Tree */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={18} color="var(--neon-cyan)" />
            {t('synthesis.sessionsTree')}
          </h3>

          {sessions.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '10px 0' }}>
              No research sessions recorded. Launch a query in New Crawl.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '580px', overflowY: 'auto' }}>
              {sessions.map(s => {
                const isSelected = selectedSessionId === s.session_id;
                return (
                  <div
                    key={s.session_id}
                    onClick={() => loadSession(s.session_id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--neon-accent)' : 'var(--border-glow)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {isSelected ? <FolderOpen size={16} color="var(--neon-cyan)" /> : <Folder size={16} color="var(--text-dim)" />}
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: isSelected ? 'var(--neon-accent)' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.research_prompt || 'Untitled Session'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <span>{s.completed_jobs}/{s.total_jobs} complete</span>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Synthesis Workbench & Source Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Source Selector Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Research Sources</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('synthesis.selectSourcesPrompt')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSelectAll} className="cyber-btn cyber-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  Select All
                </button>
                <button onClick={handleClearAll} className="cyber-btn cyber-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  Clear
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedJobIds.size === 0}
                  className="cyber-btn cyber-btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <Trash2 size={13} />
                  Bulk Delete ({selectedJobIds.size})
                </button>
              </div>
            </div>

            {/* Source items list with checkboxes */}
            {!currentSessionDetails || currentSessionDetails.jobs.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Select a research session from the left archive.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {currentSessionDetails.jobs.map(j => {
                  const entity = currentSessionDetails.entities.find(e => e.job_id === j.id);
                  const isChecked = selectedJobIds.has(j.id);

                  return (
                    <div
                      key={j.id}
                      onClick={() => toggleJobSelect(j.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isChecked ? 'var(--neon-accent-dim)' : 'var(--bg-secondary)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--neon-accent)' : 'var(--border-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        {isChecked ? <CheckSquare size={18} color="var(--neon-accent)" /> : <Square size={18} color="var(--text-dim)" />}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {entity?.title || j.url}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {j.url}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectPayload(j.id);
                          }}
                          title="Inspect raw extracted payload (Approach D)"
                          className="cyber-btn cyber-btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                        {entity && (
                          <span className={`badge ${entity.sentiment_label === 'Positive' ? 'badge-pos' : entity.sentiment_label === 'Negative' ? 'badge-neg' : 'badge-neu'}`}>
                            {entity.sentiment_label} ({entity.sentiment_score})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Synthesize Action Bar */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glow)', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={synthesisQuery}
                onChange={(e) => setSynthesisQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSynthesize(); }}
                placeholder="Target synthesis inquiry (e.g. Compare pricing, summarize key risks)..."
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <button
                onClick={handleSynthesize}
                disabled={synthesizing || selectedJobIds.size === 0}
                className="cyber-btn cyber-btn-primary"
              >
                <Sparkles size={16} />
                {synthesizing ? 'Synthesizing...' : t('synthesis.synthesizeBtn')}
              </button>
            </div>
          </div>

          {/* Synthesis Distillation Output */}
          {synthesizedResult && (
            synthesizedResult.matched === false ? (
              /* Inquiry Didn't Match Any Selected Resources */
              <div className="glass-panel" style={{ padding: '24px', border: '1.5px solid var(--neon-amber)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertCircle size={22} color="var(--neon-amber)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neon-amber)' }}>
                    {synthesizedResult.message || "The inquiry didn't match any selected resources"}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {synthesizedResult.reason || "The inquiry you entered does not match the topics, entities, or content found in the selected crawled resources. Please ask a question related to the target pages or select different sources from the archive."}
                </p>
                {synthesizedResult.inquiry && (
                  <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Tested inquiry: <code style={{ color: 'var(--neon-accent)' }}>"{synthesizedResult.inquiry}"</code> across {synthesizedResult.totalSourcesAnalyzed || selectedJobIds.size} selected resource(s).
                  </div>
                )}
              </div>
            ) : (
              /* Matched Synthesis Report with Direct Answer */
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Data Synthesis Report
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-direct" style={{ fontSize: '0.74rem' }}>
                      {synthesizedResult.model || 'all-MiniLM-L6-v2 (Neural Embeddings)'}
                    </span>
                    {synthesizedResult.semanticSimilarity && (
                      <span className="badge badge-pos" style={{ fontSize: '0.74rem' }}>
                        Peak Match: {(synthesizedResult.semanticSimilarity * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Answer to Inquiry */}
                {synthesizedResult.directAnswer && (
                  <div style={{ padding: '16px 20px', background: 'var(--neon-accent-dim)', border: '1px solid var(--neon-accent)', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--neon-accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                      Synthesized Analysis & Direct Answer
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: 500 }}>
                      {synthesizedResult.directAnswer}
                    </p>
                  </div>
                )}

                {/* Consensus & Polarity */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-glow)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Consensus Polarity</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: synthesizedResult.consensusLabel === 'Positive' ? 'var(--neon-green)' : synthesizedResult.consensusLabel === 'Negative' ? 'var(--neon-red)' : 'var(--neon-accent)' }}>
                      {synthesizedResult.consensusLabel}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Aggregate Score: {synthesizedResult.consensusScore}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-glow)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Sources Analyzed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--neon-blue)', fontFamily: 'var(--font-mono)' }}>
                      {synthesizedResult.totalSourcesAnalyzed} Endpoints
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Extracted from verified crawled page content
                    </div>
                  </div>
                </div>

                {/* Cross-Source Dominant Entities */}
                {synthesizedResult.topSharedEntities?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Identified Topic Entities:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {synthesizedResult.topSharedEntities.map(([term, count]) => (
                        <span key={term} className="entity-pill" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                          {term} <strong style={{ color: 'var(--neon-accent)', marginLeft: '4px' }}>×{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Findings */}
                {synthesizedResult.keyFindings?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-muted)' }}>
                      {t('synthesis.keyFindings')}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {synthesizedResult.keyFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            background: 'var(--bg-secondary)',
                            borderLeft: '3px solid var(--neon-accent)',
                            borderRadius: '0 8px 8px 0',
                            fontSize: '0.86rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.5'
                          }}
                        >
                          {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid var(--neon-red)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 45, 85, 0.2)', border: '1px solid var(--neon-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={22} color="var(--neon-red)" />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{t('synthesis.confirmDeleteTitle')}</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
              {t('synthesis.confirmDeleteText')} This action will permanently eliminate {selectedJobIds.size} crawl tasks and their associated intelligence entries.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cyber-btn cyber-btn-secondary"
              >
                {t('synthesis.cancel')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="cyber-btn cyber-btn-danger"
              >
                {deleting ? 'Purging...' : t('synthesis.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approach D: Payload Inspection Modal */}
      {inspectingJobId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 130,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glow)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} color="var(--neon-accent)" />
                  Approach D: Content & Payload Verification
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Inspect raw crawled text stored in SQLite & MongoDB Atlas before synthesis
                </span>
              </div>
              <button
                onClick={() => setInspectingJobId(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingPayload ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neon-accent)' }}>
                Loading extracted payload from cluster...
              </div>
            ) : payloadData?.error ? (
              <div style={{ padding: '20px', color: 'var(--neon-red)' }}>
                Error fetching payload: {payloadData.error}
              </div>
            ) : payloadData ? (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, paddingRight: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-blue)', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {payloadData.url}
                  </span>
                  <span className={`badge ${payloadData.verification?.is_bot_blocked ? 'badge-neg' : payloadData.verification?.is_thin ? 'badge-neu' : 'badge-pos'}`}>
                    {payloadData.verification?.status}
                  </span>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Recommendation: </strong> {payloadData.verification?.recommendation}
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                  <span>Characters: <strong style={{ color: 'var(--text-main)' }}>{payloadData.character_count}</strong></span>
                  <span>Words: <strong style={{ color: 'var(--text-main)' }}>{payloadData.word_count}</strong></span>
                  <span>Sentiment: <strong style={{ color: 'var(--text-main)' }}>{payloadData.sentiment_label}</strong></span>
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Extracted Body Snippet:
                  </div>
                  <pre style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-glow)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {payloadData.snippet || 'No text snippet found for this record.'}
                  </pre>
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-glow)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setInspectingJobId(null)} className="cyber-btn cyber-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
