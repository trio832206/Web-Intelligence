import React from 'react';
import CrawlManager from '../components/CrawlManager';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [crawlRefreshTrigger, setCrawlRefreshTrigger] = React.useState(0);

  const handleCrawlCompleted = () => {
    setCrawlRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      <CrawlManager onCrawlCompleted={handleCrawlCompleted} />
      <div style={{ height: '1px', background: 'var(--border-glow)', margin: '8px 0' }} />
      <Dashboard key={crawlRefreshTrigger} />
    </div>
  );
}
