import asyncio
import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, CrawlJob, ExtractedEntity

async def cleanup_old_data():
    """
    Background task to delete jobs and entities older than 24 hours.
    """
    while True:
        try:
            print("Running cleanup task for data older than 24 hours...")
            db: Session = SessionLocal()
            cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(days=1)
            
            # Find old jobs
            old_jobs = db.query(CrawlJob).filter(CrawlJob.created_at < cutoff_time).all()
            
            if old_jobs:
                job_ids = [job.id for job in old_jobs]
                
                # Delete corresponding entities
                db.query(ExtractedEntity).filter(ExtractedEntity.job_id.in_(job_ids)).delete(synchronize_session=False)
                
                # Delete jobs
                db.query(CrawlJob).filter(CrawlJob.id.in_(job_ids)).delete(synchronize_session=False)
                
                db.commit()
                print(f"Cleanup complete. Deleted {len(old_jobs)} jobs and their entities.")
            else:
                print("Cleanup complete. No old jobs to delete.")
                
            db.close()
        except Exception as e:
            print(f"Error in cleanup task: {e}")
        
        # Sleep for an hour before checking again
        await asyncio.sleep(3600)
