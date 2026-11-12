"""
Database Migration and Backfill Script for resumes_llm
Adds filename, file_type, and raw_text columns and populates them for all existing records.
"""

import os
import sys
import re
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import engine, SessionLocal
from models import Resume
from routes.resumes import find_resume_file, extract_file_content

def migrate_and_backfill():
    print("🚀 Starting migration and backfill for 'resumes_llm'...")

    # 1. Add columns to PostgreSQL if they don't already exist
    with engine.connect() as conn:
        print("📦 Adding columns 'filename', 'file_type', 'raw_text' to 'resumes_llm'...")
        conn.execute(text("ALTER TABLE resumes_llm ADD COLUMN IF NOT EXISTS filename VARCHAR;"))
        conn.execute(text("ALTER TABLE resumes_llm ADD COLUMN IF NOT EXISTS file_type VARCHAR;"))
        conn.execute(text("ALTER TABLE resumes_llm ADD COLUMN IF NOT EXISTS raw_text TEXT;"))
        conn.commit()
        print("✅ Columns verified/added successfully.")

    # 2. Backfill existing records
    db = SessionLocal()
    try:
        candidates = db.query(Resume).all()
        print(f"🔍 Found {len(candidates)} candidate records in database to inspect/backfill.")

        updated_count = 0
        for c in candidates:
            # Find the original file
            matched_file = find_resume_file(c.name, c.email)
            if matched_file and os.path.exists(matched_file):
                filename = os.path.basename(matched_file)
                content = extract_file_content(matched_file)
                clean_text = (content.get("text") or "").replace("\x00", "")
                
                c.filename = filename
                c.file_type = content.get("type", "txt")
                c.raw_text = clean_text
                updated_count += 1
                print(f"  ✓ Updated {c.name}: {filename} ({c.file_type}) - {len(c.raw_text)} chars")
            else:
                # Fallback: construct clean text from existing fields
                if not c.raw_text:
                    fallback_text = (
                        f"Candidate: {c.name}\n"
                        f"Email: {c.email} | Phone: {c.mobile_number or 'N/A'}\n"
                        f"Location: {c.location or 'Not specified'}\n"
                        f"Experience: {c.years_experience or 0} years\n\n"
                        f"Skills:\n" + "\n".join(f"- {s}" for s in (c.skills or [])) + "\n\n"
                        f"Past Roles:\n" + "\n".join(f"- {r}" for s in (c.prev_roles or []))
                    ).replace("\x00", "")
                    c.raw_text = fallback_text
                    c.file_type = "text"
                    c.filename = f"{c.name.replace(' ', '_')}.txt"
                    updated_count += 1
                    print(f"  ~ Fallback text generated for {c.name}")

        db.commit()
        print(f"🎉 Successfully migrated and backfilled {updated_count} candidate records!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during migration/backfill: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_backfill()
