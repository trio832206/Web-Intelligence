import { useState, useEffect } from 'react';

type Job = {
  id: string;
  url: string;
  status: string;
  created_at: string;
};

type Entity = {
  id: string;
  title: string;
  url: string;
  content_snippet: string;
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  const getResetTimes = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    const lastReset = new Date(now);
    lastReset.setHours(4, 0, 0, 0);
    
    const nextReset = new Date(now);
    nextReset.setHours(4, 0, 0, 0);

    if (currentHour < 4) {
      lastReset.setDate(lastReset.getDate() - 1);
    } else {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    
    return { lastReset, nextReset };
  };

  const { lastReset, nextReset } = getResetTimes();

  const recentJobs = jobs.filter(job => {
    // Backend returns naive UTC string, so append 'Z' for correct parsing
    const jobTimeStr = job.created_at.endsWith('Z') ? job.created_at : job.created_at + 'Z';
    const jobTime = new Date(jobTimeStr);
    return jobTime >= lastReset;
  });

  const resetTag = `Next Reset: ${nextReset.toLocaleDateString()} 04:00 AM`;
  
  // We will only use real fetch, no mock data
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/crawls')
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []))
      .catch(console.error);

    fetch('http://localhost:8000/api/v1/data/search')
      .then(res => res.json())
      .then(data => setEntities(data.results || []))
      .catch(console.error);
  }, []);

  const ITEMS_PER_PAGE = 5;
  const [jobsPage, setJobsPage] = useState(1);
  const [entitiesPage, setEntitiesPage] = useState(1);

  const handleExport = () => {
    if (entities.length === 0) return;
    
    const headers = ['id', 'title', 'url', 'content_snippet'];
    const csvContent = [
      headers.join(','),
      ...entities.map(e => `"${e.id}","${e.title}","${e.url}","${e.content_snippet.replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'extracted_entities.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentJobs = recentJobs.slice((jobsPage - 1) * ITEMS_PER_PAGE, jobsPage * ITEMS_PER_PAGE);
  const currentEntities = entities.slice((entitiesPage - 1) * ITEMS_PER_PAGE, entitiesPage * ITEMS_PER_PAGE);

  const totalJobsPages = Math.ceil(recentJobs.length / ITEMS_PER_PAGE) || 1;
  const totalEntitiesPages = Math.ceil(entities.length / ITEMS_PER_PAGE) || 1;

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Platform Overview</h2>
          <p>Real-time insights and crawling metrics</p>
        </div>
        <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Data
        </button>
      </div>

      <div className="grid-cards">
        <div className="carved-panel kpi-card">
          <h3>Total URLs Crawled</h3>
          <p className="value">{jobs.length}</p>
          <span className="trend">Updated just now</span>
        </div>
        <div className="carved-panel kpi-card">
          <h3>Active Jobs</h3>
          <p className="value">{jobs.filter(j => j.status === 'running').length}</p>
          <span className="trend">System healthy</span>
        </div>
        <div className="carved-panel kpi-card">
          <h3>Entities Extracted</h3>
          <p className="value">{entities.length}</p>
          <span className="trend">High confidence</span>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="carved-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            Recent Crawl Jobs
            <span style={{ fontSize: '0.8em', fontWeight: 'normal', opacity: 0.7, padding: '2px 8px', background: 'var(--code-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {resetTag}
            </span>
          </h3>
          <div className="data-table-wrapper" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target URL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.map(job => (
                  <tr key={job.id}>
                    <td>{job.url}</td>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {currentJobs.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', opacity: 0.7 }}>No jobs found in current cycle.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalJobsPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => setJobsPage(p => Math.max(1, p - 1))} 
                disabled={jobsPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">Page {jobsPage} of {totalJobsPages}</span>
              <button 
                onClick={() => setJobsPage(p => Math.min(totalJobsPages, p + 1))} 
                disabled={jobsPage === totalJobsPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="carved-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0 }}>Recently Extracted Entities (with AI/NLP)</h3>
          <div className="data-table-wrapper" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Sentiment</th>
                  <th>Snippet</th>
                </tr>
              </thead>
              <tbody>
                {currentEntities.map((entity: any) => (
                  <tr key={entity.id}>
                    <td>
                      <a href={entity.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-h)', textDecoration: 'none' }}>
                        {entity.title}
                      </a>
                    </td>
                    <td>
                      {entity.sentiment_label ? (
                        <span className={`status-badge ${
                          entity.sentiment_label === 'Positive' ? 'status-completed' : 
                          entity.sentiment_label === 'Negative' ? 'status-failed' : 'status-running'
                        }`}>
                          {entity.sentiment_label}
                        </span>
                      ) : (
                        <span className="status-badge" style={{ opacity: 0.5 }}>Pending</span>
                      )}
                    </td>
                    <td><small>{entity.content_snippet}</small></td>
                  </tr>
                ))}
                {currentEntities.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', opacity: 0.7 }}>No entities extracted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalEntitiesPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => setEntitiesPage(p => Math.max(1, p - 1))} 
                disabled={entitiesPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">Page {entitiesPage} of {totalEntitiesPages}</span>
              <button 
                onClick={() => setEntitiesPage(p => Math.min(totalEntitiesPages, p + 1))} 
                disabled={entitiesPage === totalEntitiesPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
