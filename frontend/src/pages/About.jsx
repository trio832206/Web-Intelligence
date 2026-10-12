import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Search, Sparkles, BarChart2, Bell, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '36px', position: 'relative' }}>
        
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--neon-accent-dim)', border: '1px solid var(--neon-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 24px var(--neon-accent-dim)'
          }}>
            <Shield size={30} color="var(--neon-accent)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-main)', margin: '0 0 8px' }}>
            WEB INTELLIGENCE
          </h1>
          <p style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.02em', margin: 0 }}>
            Automated Investigative Research & Data Intelligence Platform
          </p>
        </div>

        {/* Short & Concise Overview */}
        <div style={{
          padding: '16px 20px', background: 'var(--bg-secondary)',
          borderRadius: '10px', border: '1px solid var(--border-glow)',
          fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)',
          marginBottom: '24px'
        }}>
          Web Intelligence is an automated platform designed to turn complex inquiries into structured findings. 
          Submit any topic or research objective, and the system autonomously discovers authoritative public sources, 
          gathers key insights, and synthesizes clean intelligence reports in real time.
        </div>

        {/* Core Pillars (Non-technical & High-level) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          
          <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-accent)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              <Search size={16} />
              <span>Prompt-Guided Research</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Ask questions or specify goals; the platform identifies relevant digital sources and compiles verified findings.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              <Sparkles size={16} />
              <span>Insight Synthesis</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Automatically detects key names, organizations, and trends with structured sentiment summaries.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb800', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              <BarChart2 size={16} />
              <span>Knowledge Visualizer</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Explore connected entities and topic relationships through interactive graphical views.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-accent)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              <Bell size={16} />
              <span>Automated Alerts</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Set custom monitoring rules to receive instant notifications when crucial updates occur.
            </p>
          </div>

        </div>

        {/* Security & Access Policy note */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', background: 'rgba(0, 255, 136, 0.06)',
          borderRadius: '8px', border: '1px solid var(--neon-accent)',
          fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '28px'
        }}>
          <Lock size={16} color="var(--neon-accent)" />
          <span>
            Access is restricted to authorized operators <strong>(18+ years)</strong>. All new accounts require administrative verification.
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/login')}
            className="cyber-btn cyber-btn-primary"
            style={{ flex: 1, minWidth: '180px', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </button>
          
          <Link
            to="/register"
            className="cyber-btn cyber-btn-secondary"
            style={{ minWidth: '150px', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            Request Access
          </Link>
        </div>

      </div>
    </div>
  );
}
