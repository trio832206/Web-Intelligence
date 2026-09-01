from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db, CrawlJob, ExtractedEntity
from ..crawler.engine import execute_crawl

router = APIRouter()

class CrawlRequest(BaseModel):
    url: str
    depth: int = 1
    use_browser: bool = False
    strict_robots: bool = False

@router.post("/crawls")
def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    job = CrawlJob(url=request.url, depth=request.depth)
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Run the crawler in the background
    background_tasks.add_task(execute_crawl, job.id, job.url, job.depth, request.use_browser, request.strict_robots)
    
    return {"status": "queued", "job_id": job.id, "url": job.url}

@router.get("/crawls")
def get_crawls(db: Session = Depends(get_db)):
    jobs = db.query(CrawlJob).order_by(CrawlJob.created_at.desc()).limit(20).all()
    return {"jobs": jobs}

@router.get("/crawls/{job_id}/status")
def get_crawl_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    
    entities = db.query(ExtractedEntity).filter(ExtractedEntity.job_id == job_id).all()
    return {"job_id": job.id, "status": job.status, "entities": entities}

@router.get("/data/search")
def search_data(q: str = "", db: Session = Depends(get_db)):
    if not q:
        entities = db.query(ExtractedEntity).order_by(ExtractedEntity.extracted_at.desc()).limit(20).all()
    else:
        entities = db.query(ExtractedEntity).filter(
            ExtractedEntity.title.contains(q) | ExtractedEntity.content_snippet.contains(q)
        ).limit(20).all()
    return {"query": q, "results": entities}

from ..database import AlertRule, AlertNotification

class AlertRuleCreate(BaseModel):
    name: str
    keyword: str = None
    sentiment_threshold: str = None

@router.post("/alerts")
def create_alert(rule: AlertRuleCreate, db: Session = Depends(get_db)):
    new_rule = AlertRule(name=rule.name, keyword=rule.keyword, sentiment_threshold=rule.sentiment_threshold)
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    rules = db.query(AlertRule).all()
    notifications = db.query(AlertNotification).order_by(AlertNotification.created_at.desc()).limit(50).all()
    return {"rules": rules, "notifications": notifications}

class ChatQuery(BaseModel):
    query: str

@router.post("/chat")
def chat_query(req: ChatQuery, db: Session = Depends(get_db)):
    # Simple semantic/keyword search mock for conversational query
    q = req.query.lower()
    
    # Filter by sentiment if mentioned
    sentiment_filter = None
    if "positive" in q: sentiment_filter = "Positive"
    elif "negative" in q: sentiment_filter = "Negative"
    
    query_obj = db.query(ExtractedEntity)
    if sentiment_filter:
        query_obj = query_obj.filter(ExtractedEntity.sentiment_label == sentiment_filter)
        
    # Generic keyword match in snippet
    clean_q = q.replace('positive', '').replace('negative', '').strip()
    if clean_q:
        results = query_obj.filter(ExtractedEntity.content_snippet.ilike(f"%{clean_q}%")).limit(10).all()
    else:
        results = query_obj.limit(10).all()
        
    return {
        "reply": f"Found {len(results)} results matching your query.",
        "entities": results
    }

