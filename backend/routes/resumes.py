import os
import re
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from sqlalchemy.orm import Session
from services.search_batch import run_search_pipeline
from db import SessionLocal, get_db
from models import Resume, SearchHistory
from utils.jwt import verify_token
import traceback

router = APIRouter()

RESUMES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "applicants_resumes")

def get_user_email_from_request(req: Request) -> Optional[str]:
    """Extract authenticated user email from Bearer token if present."""
    auth_header = req.headers.get("Authorization")
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "").strip()
    try:
        payload = verify_token(token)
        return payload.get("email") if payload else None
    except Exception:
        return None

def clean_display_name(raw_name: str) -> str:
    if not raw_name:
        return "Candidate"
    clean = re.sub(r'^(Resume|RESUME|CV|Dice_Profile_|Dice_Resume_CV_)\s*', '', raw_name, flags=re.I)
    clean = re.sub(r'\s+20\d\d.*$', '', clean).strip()
    return clean.replace('_', ' ').replace('+', ' ').strip()

def find_resume_file(name: str, email: str) -> Optional[str]:
    if not os.path.exists(RESUMES_DIR):
        return None
    files = os.listdir(RESUMES_DIR)
    
    clean = clean_display_name(name)
    words = [w.lower() for w in clean.split() if len(w) > 2]
    email_user = (email or '').split('@')[0].lower()
    
    best_file = None
    max_score = 0
    for f in files:
        f_lower = f.lower()
        score = sum(2 for w in words if w in f_lower)
        if email_user and email_user in f_lower:
            score += 3
        if score > max_score:
            max_score = score
            best_file = f
            
    if best_file and max_score > 0:
        return os.path.join(RESUMES_DIR, best_file)
    return None

def extract_file_content(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".docx":
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return {"type": "docx", "text": "\n\n".join(paragraphs), "paragraphs": paragraphs}
        elif ext == ".pdf":
            import fitz
            paragraphs = []
            with fitz.open(file_path) as doc:
                for page in doc:
                    page_text = page.get_text()
                    paragraphs.extend([p.strip() for p in page_text.split("\n\n") if p.strip()])
            return {"type": "pdf", "text": "\n\n".join(paragraphs), "paragraphs": paragraphs}
        elif ext in [".txt", ".doc"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read().strip()
            paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
            return {"type": ext.lstrip("."), "text": text, "paragraphs": paragraphs}
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
    return {"type": "unknown", "text": "", "paragraphs": []}

class SearchRequest(BaseModel):
    job_description: str
    top_k: int = 10

class CandidateProfile(BaseModel):
    document_id: str
    name: str
    email: str
    mobile_number: str
    years_experience: float
    skills: List[str]
    prev_roles: List[str]
    location: str
    score: float

    model_config = ConfigDict(from_attributes=True)

@router.post("/search", response_model=List[CandidateProfile])
async def search_resumes(request: SearchRequest, req: Request, db: Session = Depends(get_db)):
    try:
        user_email = get_user_email_from_request(req)
        query_hash = hashlib.sha256(request.job_description.strip().lower().encode("utf-8")).hexdigest()

        results = run_search_pipeline(request.job_description, request.top_k)

        profiles = []
        raw_scores = []
        for r in results:
            profile = db.query(Resume).filter(Resume.document_id == r.id).first()
            if not profile:
                continue
            score_val = round(r.score, 2)
            raw_scores.append({"id": r.id, "score": score_val})
            profiles.append(CandidateProfile(
                document_id=r.id,
                name=clean_display_name(profile.name),
                email=profile.email,
                mobile_number=profile.mobile_number,
                years_experience=profile.years_experience,
                skills=profile.skills or [],
                prev_roles=profile.prev_roles or [],
                location=profile.location,
                score=score_val
            ))

        # Persist to search_history
        try:
            lines = [l.strip() for l in request.job_description.strip().split("\n") if l.strip()]
            job_title = lines[0][:80] if lines else "Talent Search"
            
            history_entry = SearchHistory(
                user_email=user_email,
                query_hash=query_hash,
                job_title=job_title,
                job_description=request.job_description,
                results=raw_scores,
                match_count=len(profiles),
                created_at=datetime.now(timezone.utc)
            )
            db.add(history_entry)
            db.commit()
        except Exception as save_err:
            print(f"⚠️ Warning: Could not save search history: {save_err}")
            db.rollback()

        return profiles

    except Exception as e:
        print("Error occurred in search:")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/searches/history")
async def get_search_history(req: Request, db: Session = Depends(get_db)):
    """Fetch recent search history for the user or latest searches."""
    user_email = get_user_email_from_request(req)
    query = db.query(SearchHistory)
    if user_email:
        query = query.filter(SearchHistory.user_email == user_email)
    
    searches = query.order_by(SearchHistory.created_at.desc()).limit(20).all()
    return [
        {
            "id": s.id,
            "job_title": s.job_title or "Talent Search",
            "job_description": s.job_description,
            "match_count": s.match_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "user_email": s.user_email
        }
        for s in searches
    ]

@router.get("/searches/history/{search_id}")
async def get_search_by_id(search_id: int, db: Session = Depends(get_db)):
    """Rehydrate a saved search with candidate details in ~2ms without calling LLM."""
    search_record = db.query(SearchHistory).filter(SearchHistory.id == search_id).first()
    if not search_record:
        raise HTTPException(status_code=404, detail="Search record not found")

    profiles = []
    for item in (search_record.results or []):
        doc_id = item.get("id")
        score = item.get("score", 0)
        profile = db.query(Resume).filter(Resume.document_id == doc_id).first()
        if profile:
            profiles.append(CandidateProfile(
                document_id=doc_id,
                name=clean_display_name(profile.name),
                email=profile.email,
                mobile_number=profile.mobile_number,
                years_experience=profile.years_experience,
                skills=profile.skills or [],
                prev_roles=profile.prev_roles or [],
                location=profile.location,
                score=score
            ))

    return {
        "id": search_record.id,
        "job_title": search_record.job_title,
        "job_description": search_record.job_description,
        "created_at": search_record.created_at.isoformat() if search_record.created_at else None,
        "results": profiles
    }

@router.delete("/searches/history/{search_id}")
async def delete_search_history(search_id: int, db: Session = Depends(get_db)):
    search_record = db.query(SearchHistory).filter(SearchHistory.id == search_id).first()
    if not search_record:
        raise HTTPException(status_code=404, detail="Search record not found")
    db.delete(search_record)
    db.commit()
    return {"message": "Search record removed successfully"}

@router.get("/profile/{document_id}", response_model=CandidateProfile)
async def get_profile(document_id: str, db: Session = Depends(get_db)):
    profile = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return CandidateProfile(
        document_id=profile.document_id,
        name=clean_display_name(profile.name),
        email=profile.email,
        mobile_number=profile.mobile_number,
        years_experience=profile.years_experience,
        skills=profile.skills or [],
        prev_roles=profile.prev_roles or [],
        location=profile.location,
        score=0
    )

@router.get("/resume/{document_id}/preview")
async def preview_resume(document_id: str, db: Session = Depends(get_db)):
    profile = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 1. Fast path: If raw_text is stored in PostgreSQL, return directly (1ms)
    if profile.raw_text:
        paragraphs = [p.strip() for p in profile.raw_text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [p.strip() for p in profile.raw_text.split("\n") if p.strip()]
        return {
            "name": clean_display_name(profile.name),
            "filename": profile.filename or f"{clean_display_name(profile.name)}.{profile.file_type or 'txt'}",
            "has_file": bool(profile.filename),
            "file_type": profile.file_type or "text",
            "text": profile.raw_text,
            "paragraphs": paragraphs
        }

    # 2. Fallback: Search disk if not yet backfilled
    file_path = find_resume_file(profile.name, profile.email)
    if not file_path or not os.path.exists(file_path):
        return {
            "name": clean_display_name(profile.name),
            "filename": None,
            "has_file": False,
            "file_type": "text",
            "text": f"Candidate: {clean_display_name(profile.name)}\nEmail: {profile.email}\nExperience: {profile.years_experience} years\nSkills: {', '.join(profile.skills or [])}\nRoles: {', '.join(profile.prev_roles or [])}",
            "paragraphs": [
                f"Candidate: {clean_display_name(profile.name)}",
                f"Email: {profile.email} | Phone: {profile.mobile_number}",
                f"Experience: {profile.years_experience} years | Location: {profile.location}",
                f"Key Skills: {', '.join(profile.skills or [])}",
                f"Past Roles: {', '.join(profile.prev_roles or [])}"
            ]
        }
        
    filename = os.path.basename(file_path)
    content = extract_file_content(file_path)
    return {
        "name": clean_display_name(profile.name),
        "filename": filename,
        "has_file": True,
        "file_type": content["type"],
        "text": content["text"],
        "paragraphs": content["paragraphs"]
    }

@router.get("/resume/{document_id}/download")
async def download_resume(document_id: str, db: Session = Depends(get_db)):
    profile = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    file_path = os.path.join(RESUMES_DIR, profile.filename) if profile.filename else None
    if not file_path or not os.path.exists(file_path):
        file_path = find_resume_file(profile.name, profile.email)
        
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
        
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/resume/{document_id}/raw")
async def stream_raw_resume(document_id: str, db: Session = Depends(get_db)):
    """Stream resume file inline so PDFs can be viewed natively in browser iframe."""
    profile = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    file_path = os.path.join(RESUMES_DIR, profile.filename) if profile.filename else None
    if not file_path or not os.path.exists(file_path):
        file_path = find_resume_file(profile.name, profile.email)
        
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
        
    ext = os.path.splitext(file_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "application/octet-stream"
    if ext == ".docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif ext in [".txt", ".doc"]:
        media_type = "text/plain; charset=utf-8"
        
    headers = {"Content-Disposition": f"inline; filename=\"{os.path.basename(file_path)}\""}
    return FileResponse(file_path, media_type=media_type, headers=headers)

