"""
Admin Management & Talent Pool Operations Routes
Secured with require_admin role-based access control.
"""

import os
import sys
import uuid
import zipfile
import shutil
import tempfile
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from db import get_db
from models import Resume, SearchHistory, User
from routes.auth import require_admin
from routes.resumes import clean_display_name
from ingest_resumes import extract_text, extract_candidate_info
from services.search_batch import get_qdrant_client, get_embedder
from qdrant_client.models import PointStruct, PointIdsList

router = APIRouter(dependencies=[Depends(require_admin)])

RESUMES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "applicants_resumes")
os.makedirs(RESUMES_DIR, exist_ok=True)


@router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """Fetch system health and talent pool repository metrics."""
    total_candidates = db.query(Resume).count()
    total_searches = db.query(SearchHistory).count()
    total_recruiters = db.query(User).count()

    qdrant_points = 0
    qdrant_status = "healthy"
    try:
        qdrant = get_qdrant_client()
        col = qdrant.get_collection(settings.qdrant_collection)
        qdrant_points = col.points_count or 0
    except Exception as e:
        qdrant_status = f"degraded: {str(e)[:40]}"

    return {
        "total_candidates": total_candidates,
        "total_searches": total_searches,
        "total_recruiters": total_recruiters,
        "qdrant_vectors": qdrant_points,
        "system_health": {
            "postgres": "healthy",
            "qdrant": qdrant_status,
            "groq_llm": "operational"
        }
    }


@router.get("/candidates")
async def list_admin_candidates(
    search: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Paginated list of all candidate profiles in the talent pool."""
    query = db.query(Resume)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Resume.name.ilike(s),
            Resume.email.ilike(s),
            Resume.location.ilike(s)
        ))

    total = query.count()
    candidates = query.order_by(Resume.id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "candidates": [
            {
                "document_id": c.document_id,
                "name": clean_display_name(c.name),
                "email": c.email,
                "mobile_number": c.mobile_number,
                "years_experience": c.years_experience or 0,
                "skills": c.skills or [],
                "prev_roles": c.prev_roles or [],
                "location": c.location,
                "filename": c.filename,
                "file_type": c.file_type or "unknown"
            }
            for c in candidates
        ]
    }


@router.delete("/candidates/{document_id}")
async def delete_candidate(document_id: str, db: Session = Depends(get_db)):
    """Delete candidate from PostgreSQL, Qdrant vector database, and disk storage."""
    candidate = db.query(Resume).filter(Resume.document_id == document_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 1. Remove vector from Qdrant
    try:
        qdrant = get_qdrant_client()
        qdrant.delete(
            collection_name=settings.qdrant_collection,
            points_selector=PointIdsList(points=[document_id])
        )
    except Exception as q_err:
        print(f"⚠️ Warning: Could not delete vector from Qdrant: {q_err}")

    # 2. Remove file from disk if present
    if candidate.filename:
        file_path = os.path.join(RESUMES_DIR, candidate.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as f_err:
                print(f"⚠️ Warning: Could not remove file {file_path}: {f_err}")

    # 3. Remove row from PostgreSQL
    db.delete(candidate)
    db.commit()

    return {"message": f"Candidate '{candidate.name}' deleted successfully from database and vector index."}


@router.post("/upload-resumes")
async def upload_resumes_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk resume upload endpoint for Admins.
    Accepts multiple .pdf / .docx files OR a single .zip archive containing resumes.
    Automatically parses, creates PostgreSQL records, and indexes Qdrant vector points.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    temp_dir = tempfile.mkdtemp(prefix="tf_admin_upload_")
    files_to_process = []

    try:
        # 1. Save uploaded files or extract ZIP
        for upload in files:
            orig_name = upload.filename or "unknown_file"
            ext = os.path.splitext(orig_name)[1].lower()

            if ext == ".zip":
                zip_path = os.path.join(temp_dir, orig_name)
                with open(zip_path, "wb") as f:
                    shutil.copyfileobj(upload.file, f)
                
                # Unzip contents
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    for member in zip_ref.namelist():
                        member_ext = os.path.splitext(member)[1].lower()
                        # Avoid mac metadata folders or non-resume files
                        if member_ext in [".pdf", ".docx", ".doc", ".txt"] and not member.startswith("__MACOSX"):
                            extracted_path = zip_ref.extract(member, temp_dir)
                            files_to_process.append(extracted_path)
            elif ext in [".pdf", ".docx", ".doc", ".txt"]:
                dest_path = os.path.join(temp_dir, orig_name)
                with open(dest_path, "wb") as f:
                    shutil.copyfileobj(upload.file, f)
                files_to_process.append(dest_path)

        if not files_to_process:
            raise HTTPException(status_code=400, detail="No valid .pdf, .docx, or .txt resumes found in upload.")

        # 2. Lazy load embedder
        try:
            embedder = get_embedder()
            qdrant = get_qdrant_client()
            embed_instruction = "Represent the resume for finding candidate profiles:"
        except Exception as e:
            print(f"⚠️ Vector model loading error: {e}")
            embedder = None
            qdrant = None

        indexed_count = 0
        duplicate_count = 0
        error_list = []

        # 3. Process each resume
        for fpath in files_to_process:
            fname = os.path.basename(fpath)
            ext = os.path.splitext(fname)[1].lower().lstrip(".")

            try:
                raw_text = extract_text(fpath).replace("\x00", "")
                if not raw_text.strip():
                    error_list.append({"file": fname, "reason": "No readable text extracted"})
                    continue

                info = extract_candidate_info(fname, raw_text)

                # Copy to permanent applicants_resumes folder
                perm_path = os.path.join(RESUMES_DIR, fname)
                shutil.copy2(fpath, perm_path)

                # Check if candidate email already exists
                existing = db.query(Resume).filter(Resume.email == info["email"]).first()
                if existing:
                    doc_id = existing.document_id
                    existing.filename = fname
                    existing.file_type = ext
                    existing.raw_text = raw_text
                    existing.skills = info["skills"]
                    existing.prev_roles = info["prev_roles"]
                    existing.years_experience = info["years_experience"]
                    db.commit()
                    duplicate_count += 1
                else:
                    doc_id = str(uuid.uuid4())
                    new_candidate = Resume(
                        document_id=doc_id,
                        name=info["name"],
                        email=info["email"],
                        mobile_number=info["mobile_number"],
                        years_experience=info["years_experience"],
                        skills=info["skills"],
                        prev_roles=info["prev_roles"],
                        location=info["location"],
                        filename=fname,
                        file_type=ext,
                        raw_text=raw_text,
                    )
                    db.add(new_candidate)
                    db.commit()
                    indexed_count += 1

                # Qdrant Vector Upsert
                if embedder and qdrant:
                    try:
                        emb_text = (
                            f"{info['name']} - Skills: {', '.join(info['skills'])}. "
                            f"Roles: {', '.join(info['prev_roles'])}. "
                            f"Experience: {info['years_experience']} years. "
                            f"Resume: {raw_text[:1500]}"
                        )
                        vector = embedder.encode([[embed_instruction, emb_text]])[0].tolist()
                        qdrant.upsert(
                            collection_name=settings.qdrant_collection,
                            points=[
                                PointStruct(
                                    id=doc_id,
                                    vector=vector,
                                    payload={
                                        "document_id": doc_id,
                                        "skills": info["skills"],
                                        "roles": info["prev_roles"],
                                        "experience": info["years_experience"],
                                        "name": info["name"]
                                    }
                                )
                            ]
                        )
                    except Exception as ve:
                        print(f"⚠️ Qdrant indexing failed for {fname}: {ve}")

            except Exception as item_err:
                error_list.append({"file": fname, "reason": str(item_err)})

        return {
            "message": "Bulk ingestion completed successfully.",
            "total_files_found": len(files_to_process),
            "newly_indexed": indexed_count,
            "updated_duplicates": duplicate_count,
            "errors": error_list
        }

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
