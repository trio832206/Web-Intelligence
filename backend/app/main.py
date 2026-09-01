from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from .api import endpoints, auth, admin
from .tasks import cleanup_old_data
from .database import SessionLocal, User
from .api.auth import get_password_hash
from .security_middleware import SecurityMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure default admin exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            import os
            default_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin")
            hashed = get_password_hash(default_password)
            new_admin = User(username="admin", hashed_password=hashed, is_admin=1)
            db.add(new_admin)
            db.commit()
    finally:
        db.close()
        
    # Start the background task
    task = asyncio.create_task(cleanup_old_data())
    yield
    # Clean up on shutdown
    task.cancel()

app = FastAPI(
    title="Web Intelligence Platform API",
    description="Enterprise API for crawling, analyzing, and querying web data.",
    version="1.0.0",
    lifespan=lifespan
)

# Add security exploitation detection middleware
app.add_middleware(SecurityMiddleware)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(admin.router, prefix="/api/v1/admin")
app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Web Intelligence Platform API"}
