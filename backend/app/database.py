import os
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import uuid
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./web_intelligence.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Integer, default=0) # 1 for True, 0 for False (sqlite friendly bool)

class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    url = Column(String, index=True)
    depth = Column(Integer, default=1)
    status = Column(String, default="pending") # pending, running, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, index=True)
    title = Column(String)
    url = Column(String)
    content_snippet = Column(String)
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)
    named_entities = Column(String, nullable=True) # Stored as JSON string
    structured_data = Column(String, nullable=True) # Stored as JSON string
    extracted_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertRule(Base):
    __tablename__ = "alert_rules"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    keyword = Column(String, nullable=True) # Trigger if this keyword is in text
    sentiment_threshold = Column(String, nullable=True) # Positive, Negative, Neutral
    is_active = Column(Integer, default=1) # 1 for True, 0 for False (sqlite friendly bool)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertNotification(Base):
    __tablename__ = "alert_notifications"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String, index=True)
    entity_id = Column(String, index=True)
    message = Column(String)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SecurityLog(Base):
    __tablename__ = "security_logs"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, index=True) # e.g. "failed_login", "rate_limit_exceeded"
    ip_address = Column(String)
    username = Column(String, nullable=True)
    details = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Ensure tables are created (in dev)
# We will wipe the existing sqlite db so these columns take effect.

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
