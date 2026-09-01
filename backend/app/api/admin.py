from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db, User, SecurityLog
from jose import jwt, JWTError
from .auth import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin")
        if username is None or not is_admin:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_admin:
        raise credentials_exception
    return user

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    users = db.query(User).all()
    # Mask passwords
    return [{"id": u.id, "username": u.username, "is_admin": bool(u.is_admin)} for u in users]

@router.get("/security-logs")
def get_security_logs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    logs = db.query(SecurityLog).order_by(SecurityLog.created_at.desc()).limit(100).all()
    return logs

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete an admin user")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
