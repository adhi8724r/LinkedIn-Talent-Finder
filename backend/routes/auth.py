# routes/auth.py
from fastapi import Request
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas import LoginRequest, SignUpRequest
from utils.jwt import create_access_token, verify_token
from models import User
from db import SessionLocal, get_db
import bcrypt

router = APIRouter()

def get_current_user_model(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = auth_header.replace("Bearer ", "").strip()
    payload = verify_token(token)
    if not payload or "email" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == payload["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_admin(user: User = Depends(get_current_user_model)) -> User:
    role = getattr(user, "role", "recruiter")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    return user

@router.post("/signup")
def signup(state: SignUpRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == state.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = bcrypt.hashpw(state.password.encode(), bcrypt.gensalt()).decode()
    role = getattr(state, "role", "recruiter") or "recruiter"

    new_user = User(
        name=state.name,
        email=state.email,
        number=state.number,
        password=hashed_pw,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"email": state.email, "role": role})
    return {"message": "Signup successful", "token": token, "role": role, "name": new_user.name}

@router.post("/login")
def login(state: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == state.email).first()

    if not user or not bcrypt.checkpw(state.password.encode(), user.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_role = getattr(user, "role", "recruiter") or "recruiter"
    token = create_access_token({"email": state.email, "role": user_role})
    return {"message": "Login successful", "token": token, "role": user_role, "name": user.name}

@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_model(request, db)
    user_role = getattr(user, "role", "recruiter") or "recruiter"
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "number": user.number,
        "role": user_role
    }


