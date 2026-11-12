import os
import re
import time
import json
import threading
import warnings
import logging
from typing import List, Optional

# Suppress benign third-party library deprecation and rate-limit advisory logs
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message=".*tokenize.*")
warnings.filterwarnings("ignore", message=".*_target_device.*")
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from config import settings

# === CONFIG ===
QDRANT_COLLECTION = getattr(settings, "qdrant_collection", "resume_vectors")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
BATCH_SIZE = 10
api = settings.api

# === Pydantic Schema for Output ===
class CandidateScore(BaseModel):
    id: str = Field(description="The document ID of the candidate")
    score: int = Field(ge=1, le=100, description="Match score from 1 to 100")

class CandidateScores(BaseModel):
    results: List[CandidateScore]

parser = PydanticOutputParser(pydantic_object=CandidateScores)

# === Prompt Template for Batch Candidate Ranking ===
prompt = PromptTemplate(
    input_variables=["job_description", "candidates", "format_instructions"],
    template="""You are an intelligent hiring assistant designed to evaluate job candidates based on a provided job description.

Your task is to analyze each candidate's skills, past roles, and (if mentioned in the job description) years of experience, then assign a match score from 1 to 100.

---

Job Description:
{job_description}

---

Candidates:
{candidates}

Each candidate has:
- id: a unique identifier
- skills: a list of technical or domain-specific skills
- roles: a list of previous job titles or responsibilities
- experience: total years of professional experience

---

Scoring Guidelines:
- Score from 1 (very poor match) to 100 (perfect match).
- Give the highest scores only when both skills and roles align closely with the job description.
- Consider years of experience **only if** it is explicitly required in the job description.
- Do not assume or invent information that is not provided.
- Be fair and objective.

---

Return your result using this exact structure:
{format_instructions}
"""
)

# === Lazy Loaded Clients and Models ===
_qdrant_client = None
_embedder = None
_embedder_lock = threading.Lock()
_chain = None

def get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.qdrant_host, timeout=30.0, check_compatibility=False)
    return _qdrant_client

def get_embedder():
    global _embedder
    if _embedder is None:
        with _embedder_lock:
            if _embedder is None:
                from InstructorEmbedding import INSTRUCTOR
                if not hasattr(INSTRUCTOR, '_text_length'):
                    def _tl(self, text):
                        if isinstance(text, dict): return len(next(iter(text.values())))
                        elif not hasattr(text, '__len__'): return 1
                        elif len(text) == 0 or isinstance(text[0], int): return len(text)
                        else: return sum([len(t) for t in text])
                    INSTRUCTOR._text_length = _tl
                _embedder = INSTRUCTOR("hkunlp/instructor-large")
    return _embedder

_llm = None
_chain = None

def get_llm():
    global _llm
    if _llm is None:
        from langchain_groq import ChatGroq
        _llm = ChatGroq(
            model=GROQ_MODEL,
            temperature=0,
            max_tokens=4096,
            api_key=os.getenv("GROQ_API_KEY", api)
        )
    return _llm

def get_chain():
    global _chain
    if _chain is None:
        llm = get_llm()
        _chain = prompt | llm | parser
    return _chain

def run_search_pipeline(job_description: str, top_k: int = 10) -> List[CandidateScore]:
    qdrant = get_qdrant_client()
    embedder = get_embedder()
    chain = get_chain()

    query_instruction = "Represent the job description for matching resumes:"
    query_vector = embedder.encode([[query_instruction, job_description]])[0].tolist()

    search_results = qdrant.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector,
        score_threshold=0.45,
        with_payload=True,
        limit=50,
    ).points

    if not search_results:
        # Fallback without strict threshold
        search_results = qdrant.query_points(
            collection_name=QDRANT_COLLECTION,
            query=query_vector,
            with_payload=True,
            limit=50,
        ).points

    candidate_payloads = [
        {
            "id": p.payload.get("document_id"),
            "skills": p.payload.get("skills", []),
            "roles": p.payload.get("roles", []),
            "experience": p.payload.get("experience", 0),
        }
        for p in search_results
        if p.payload and p.payload.get("document_id")
    ]

    all_ranked = []

    for i in range(0, len(candidate_payloads), BATCH_SIZE):
        batch = candidate_payloads[i:i + BATCH_SIZE]
        try:
            result = chain.invoke({
                "job_description": job_description,
                "candidates": json.dumps(batch),
                "format_instructions": parser.get_format_instructions()
            })
            all_ranked.extend(result.results)
        except Exception as e:
            print(f"⚠️ Batch {i//BATCH_SIZE + 1} primary parsing issue ({e}). Using resilient recovery...")
            try:
                llm = get_llm()
                raw_response = (prompt | llm).invoke({
                    "job_description": job_description,
                    "candidates": json.dumps(batch),
                    "format_instructions": parser.get_format_instructions()
                })
                raw_text = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
                
                # Extract all successfully completed {"id": "...", "score": ...} patterns
                matches = re.findall(r'\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"score"\s*:\s*(\d+)\s*\}', raw_text)
                if matches:
                    seen_ids = set()
                    for cid, sc in matches:
                        if cid not in seen_ids:
                            all_ranked.append(CandidateScore(id=cid, score=int(sc)))
                            seen_ids.add(cid)
                    print(f"✅ Recovered {len(seen_ids)} valid candidate scores from Batch {i//BATCH_SIZE + 1}!")
                else:
                    # Graceful fallback: assign baseline score so candidates are still accessible
                    for c in batch:
                        all_ranked.append(CandidateScore(id=c["id"], score=50))
            except Exception as e2:
                print(f"⚠️ Resilient fallback failed for Batch {i//BATCH_SIZE + 1}: {e2}")
                for c in batch:
                    all_ranked.append(CandidateScore(id=c["id"], score=50))

    return sorted(all_ranked, key=lambda x: x.score, reverse=True)[:top_k]
