import { useState } from 'react';
export default function CrawlManager() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(1);
  const [useBrowser, setUseBrowser] = useState(false);
  const [strictRobots, setStrictRobots] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!url) return;
    setStatusMessage('Submitting crawl job...');
    setIsError(false);
    try {
      const res = await fetch('http://localhost:8000/api/v1/crawls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          depth,
          use_browser: useBrowser,
          strict_robots: strictRobots
        })
      });
      const data = await res.json();
      setStatusMessage(`Job submitted successfully. ID: ${data.job_id}`);
      setUrl('');
      setDepth(1);
      setUseBrowser(false);
      setStrictRobots(false);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to submit job. Check backend server.');
      setIsError(true);
    }
  };
  return <div>
      <div className="dashboard-header">
        <h2>Crawl Manager</h2>
      </div>

      <div className="grid-cards">
        <div className="carved-panel" style={{
        maxWidth: '600px',
        flex: 1
      }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="url">Target URL</label>
              <input id="url" type="url" className="input-field" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required />
            </div>

            <h3 style={{
            fontSize: '1rem',
            marginTop: '24px',
            marginBottom: '16px'
          }}>Advanced Settings</h3>
            
            <div className="input-group">
              <label htmlFor="depth">Crawl Depth</label>
              <input id="depth" type="number" min="1" max="5" className="input-field" value={depth} onChange={e => setDepth(parseInt(e.target.value) || 1)} />
              <small style={{
              color: 'var(--text)',
              opacity: 0.8
            }}>Depth 1 = just this page. Depth 2 = this page and all links on it.</small>
            </div>
            
            <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            marginBottom: '24px'
          }}>
              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--sans)'
            }}>
                <input type="checkbox" checked={useBrowser} onChange={e => setUseBrowser(e.target.checked)} style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-base)'
              }} />
                Use Headless Browser (JS Rendering)
              </label>

              <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--sans)'
            }}>
                <input type="checkbox" checked={strictRobots} onChange={e => setStrictRobots(e.target.checked)} style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-base)'
              }} />
                Strict robots.txt compliance
              </label>
            </div>
            
            <button type="submit" className="btn-primary" style={{
            width: '100%'
          }}>
              Start Crawl Job
            </button>
          </form>
          
          {statusMessage && <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '4px',
          border: `1px solid ${isError ? 'var(--danger)' : 'var(--success)'}`,
          background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: isError ? '#f87171' : '#a3e635'
        }}>
              {statusMessage}
            </div>}
        </div>

        <div className="carved-panel" style={{
        flex: 1
      }}>
          <h3 style={{
          marginTop: 0
        }}>Crawl Engine Rules</h3>
          <ul style={{
          lineHeight: '1.8',
          color: 'var(--text)'
        }}>
            <li><strong>Intelligent Extraction:</strong> Automatically identifies prices, brands, reviews, and links.</li>
            <li><strong>AI/NLP Pipeline:</strong> Submits extracted text for Semantic Sentiment analysis and Named Entity Recognition.</li>
            <li><strong>Headless Mode:</strong> If checked, uses Playwright to render SPA frameworks like React/Vue before extracting the DOM.</li>
            <li><strong>Responsible Crawling:</strong> Built-in rate limiting and random delays to avoid overwhelming target servers.</li>
          </ul>
        </div>
      </div>
    </div>;
}