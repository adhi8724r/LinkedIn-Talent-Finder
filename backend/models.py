from sqlalchemy import Column, Integer, String, Text, Float, ARRAY, DateTime, JSON
from datetime import datetime, timezone
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    number = Column(String)
    password = Column(String, nullable=False)
    organization = Column(String, default="Independent", nullable=True)
    role = Column(String, default="recruiter", nullable=False)  # "admin" or "recruiter"


class Resume(Base):
    __tablename__ = "resumes_llm"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    mobile_number = Column(String)
    years_experience = Column(Float)
    skills = Column(ARRAY(Text))         # PostgreSQL array of text
    prev_roles = Column(ARRAY(Text))     # PostgreSQL array of text
    location = Column(Text)
    filename = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=True)
    query_hash = Column(String, index=True, nullable=False)
    job_title = Column(String, nullable=True)
    job_description = Column(Text, nullable=False)
    results = Column(JSON, nullable=False)  # list of {"id": doc_id, "score": score}
    match_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
