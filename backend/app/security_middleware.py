from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from .database import SessionLocal, SecurityLog

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We can inspect request paths, count rate limits, or check for suspicious patterns.
        # For demonstration of exploitation detection, we will flag common payload strings or repeated unauthorized attempts.
        
        # In a real app, you would use a memory store like Redis for rate limiting.
        # Here we will just look for suspicious paths or query params (SQLi/XSS signatures).
        suspicious_signatures = ["<script>", "UNION SELECT", "WAITFOR DELAY", "1=1"]
        
        query_string = request.url.query.upper()
        is_suspicious = any(sig.upper() in query_string for sig in suspicious_signatures)
        
        if is_suspicious:
            ip = request.client.host if request.client else "unknown"
            db = SessionLocal()
            try:
                log = SecurityLog(
                    event_type="suspicious_payload",
                    ip_address=ip,
                    details=f"Detected exploitation signature in request: {request.url.path}?{request.url.query}"
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
                
        response = await call_next(request)
        
        # Log 401 / 403 as potential exploitation if we wanted to (handled partly in login)
        
        return response
