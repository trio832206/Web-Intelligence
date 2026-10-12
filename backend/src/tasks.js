import { db } from './database.js';

export function runHourlyCleanup() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // First, delete child extracted_entities or rely on cascade
    const entityResult = db.prepare(`
      DELETE FROM extracted_entities WHERE job_id IN (
        SELECT id FROM crawl_jobs WHERE created_at < ?
      )
    `).run(cutoff);

    const jobResult = db.prepare(`
      DELETE FROM crawl_jobs WHERE created_at < ?
    `).run(cutoff);

    // Also prune older security logs (e.g., older than 7 days)
    const logCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`DELETE FROM security_logs WHERE timestamp < ?`).run(logCutoff);

    if (jobResult.changes > 0 || entityResult.changes > 0) {
      console.log(`[Tasks] Hourly cleanup complete: removed ${jobResult.changes} expired jobs and ${entityResult.changes} entities.`);
    }
  } catch (err) {
    console.error('[Tasks Error] Cleanup failed:', err.message);
  }
}

export function startBackgroundTasks() {
  // Run once on startup
  runHourlyCleanup();
  // Run every hour
  const interval = setInterval(runHourlyCleanup, 60 * 60 * 1000);
  interval.unref(); // Don't prevent process from exiting
}
