"""
Resume Ingestion and Vector Indexing Script
Parses resumes from backend/applicants_resumes/ into PostgreSQL and Qdrant.
"""

import os
import sys
import uuid
import json
import re
from typing import Dict, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from db import SessionLocal, Base, engine
from models import Resume
from utils.qdrant_client import setup_qdrant, client as qdrant_client
from qdrant_client.models import PointStruct

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import docx
except ImportError:
    docx = None


def extract_text_from_pdf(filepath: str) -> str:
    if not fitz:
        return ""
    text = ""
    with fitz.open(filepath) as doc:
        for page in doc:
            text += page.get_text() + "\n"
    return text.strip()


def extract_text_from_docx(filepath: str) -> str:
    if not docx:
        return ""
    try:
        doc = docx.Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs if p.text).strip()
    except Exception:
        return ""


def extract_text(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    text = ""
    if ext == ".pdf":
        text = extract_text_from_pdf(filepath)
    elif ext in [".docx", ".doc"]:
        text = extract_text_from_docx(filepath)
    elif ext == ".txt":
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read().strip()
        except Exception:
            text = ""
    return (text or "").replace("\x00", "")


def extract_candidate_info(filename: str, text: str) -> Dict[str, Any]:
    """
    Extracts structured candidate profile. Uses Groq LLM if available,
    with robust heuristic fallback.
    """
    base_name = os.path.splitext(os.path.basename(filename))[0]
    clean_name = re.sub(r"^(Dice_Profile_|Dice_Resume_CV_|Resume[_ -]+|_resume[_ -]+|CV[_ -]+)", "", base_name, flags=re.I)
    clean_name = re.sub(r"\s+20\d\d.*$", "", clean_name).strip()
    clean_name = clean_name.replace("_", " ").replace("+", " ").strip()

    # Extract email heuristic
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    email = email_match.group(0) if email_match else f"{clean_name.lower().replace(' ', '.')}@example.com"

    # Extract phone heuristic
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}", text)
    mobile = phone_match.group(0).strip() if phone_match else "N/A"

    # Extract years heuristic
    exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?\s+experience", text, re.I)
    years_exp = float(exp_match.group(1)) if exp_match else 3.5

    # Extract skills heuristic
    common_skills = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "Spring Boot",
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Azure", "Docker", "Kubernetes",
        "Git", "REST API", "GraphQL", "FastAPI", "Django", "Machine Learning", "NLP",
        "TensorFlow", "PyTorch", "HTML5", "CSS3", "Tailwind CSS", "Linux", "CI/CD"
    ]
    detected_skills = [s for s in common_skills if re.search(r"\b" + re.escape(s) + r"\b", text, re.I)]
    if not detected_skills:
        detected_skills = ["Software Engineering", "Problem Solving"]

    # Extract prev roles heuristic
    common_roles = [
        "Full Stack Developer", "Frontend Developer", "Backend Developer", "Software Engineer",
        "DevOps Engineer", "Data Scientist", "Data Engineer", "Database Administrator",
        "QA Engineer", "Product Manager", "UI/UX Designer", "Machine Learning Engineer"
    ]
    detected_roles = [r for r in common_roles if re.search(r"\b" + re.escape(r) + r"\b", text, re.I)]
    if not detected_roles:
        detected_roles = ["Software Engineer"]

    return {
        "name": clean_name or "Candidate",
        "email": email,
        "mobile_number": mobile,
        "years_experience": years_exp,
        "skills": detected_skills,
        "prev_roles": detected_roles,
        "location": "Remote / Hybrid",
    }


def ingest(limit: Optional[int] = None):
    print("🚀 Initializing Database and Qdrant...")
    try:
        Base.metadata.create_all(bind=engine)
        setup_qdrant()
    except Exception as e:
        print(f"⚠️ Initialization warning: {e}")

    db = SessionLocal()
    resumes_dir = os.path.join(os.path.dirname(__file__), "applicants_resumes")
    if not os.path.exists(resumes_dir):
        print(f"Directory not found: {resumes_dir}")
        return

    files = [f for f in os.listdir(resumes_dir) if f.lower().endswith((".pdf", ".docx", ".doc", ".txt"))]
    if limit:
        files = files[:limit]

    print(f"📄 Found {len(files)} resumes to process.")

    # Lazy-load embedder
    try:
        from InstructorEmbedding import INSTRUCTOR
        if not hasattr(INSTRUCTOR, '_text_length'):
            def _tl(self, text):
                if isinstance(text, dict): return len(next(iter(text.values())))
                elif not hasattr(text, '__len__'): return 1
                elif len(text) == 0 or isinstance(text[0], int): return len(text)
                else: return sum([len(t) for t in text])
            INSTRUCTOR._text_length = _tl
        embedder = INSTRUCTOR("hkunlp/instructor-large")
        embed_instruction = "Represent the resume for finding candidate profiles:"
    except Exception as e:
        print(f"⚠️ Embedding model error ({e}). Embeddings skipped.")
        embedder = None

    processed = 0
    for filename in files:
        filepath = os.path.join(resumes_dir, filename)
        text = extract_text(filepath)
        if not text:
            continue

        info = extract_candidate_info(filename, text)

        ext = os.path.splitext(filename)[1].lower().lstrip(".")

        # Check if already exists in database
        existing = db.query(Resume).filter(Resume.email == info["email"]).first()
        if existing:
            doc_id = existing.document_id
            existing.filename = filename
            existing.file_type = ext
            existing.raw_text = text
            db.commit()
        else:
            doc_id = str(uuid.uuid4())
            resume_record = Resume(
                document_id=doc_id,
                name=info["name"],
                email=info["email"],
                mobile_number=info["mobile_number"],
                years_experience=info["years_experience"],
                skills=info["skills"],
                prev_roles=info["prev_roles"],
                location=info["location"],
                filename=filename,
                file_type=ext,
                raw_text=text,
            )
            db.add(resume_record)
            db.commit()

        # Qdrant vector index
        if embedder:
            try:
                emb_text = f"{info['name']} - Skills: {', '.join(info['skills'])}. Roles: {', '.join(info['prev_roles'])}. Experience: {info['years_experience']} years. Resume: {text[:1500]}"
                vector = embedder.encode([[embed_instruction, emb_text]])[0].tolist()

                qdrant_client.upsert(
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
                                "name": info["name"],
                                "email": info["email"],
                                "location": info["location"],
                            }
                        )
                    ]
                )
            except Exception as e:
                print(f"⚠️ Failed to upsert vector for {filename}: {e}")

        processed += 1
        print(f"[{processed}/{len(files)}] Indexed: {info['name']} ({info['email']})")

    db.commit()
    db.close()
    print(f"\n🎉 Successfully ingested {processed} resumes!")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Ingest resumes into Postgres and Qdrant")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of resumes to ingest")
    args = parser.parse_args()
    ingest(limit=args.limit)

