"""
Initializes local PostgreSQL database and tables.
Checks if 'resume_db' exists, creates it if not, and creates all tables.
"""

import sys
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from db import Base, engine
import models  # registers User and Resume models


def setup_database():
    url = settings.postgres_url
    if url.startswith("postgresql+psycopg2://"):
        parsed = urlparse(url.replace("postgresql+psycopg2://", "http://", 1))
    elif url.startswith("postgresql://"):
        parsed = urlparse(url.replace("postgresql://", "http://", 1))
    else:
        parsed = urlparse(url)

    user = parsed.username or "postgres"
    password = parsed.password or "qwerty"
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    target_db = parsed.path.lstrip("/") or "resume_db"

    print(f"🔍 Checking PostgreSQL on {host}:{port} with user '{user}'...")

    # 1. Connect to default 'postgres' database
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port,
            connect_timeout=3
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (target_db,))
        exists = cur.fetchone()
        if not exists:
            print(f"📦 Creating database '{target_db}'...")
            cur.execute(f'CREATE DATABASE "{target_db}";')
            print(f"✅ Database '{target_db}' created successfully.")
        else:
            print(f"✅ Database '{target_db}' already exists.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"⚠️ Could not connect to default 'postgres' DB: {e}")
        print("   Proceeding to create tables directly...")

    # 2. Create tables in target database
    try:
        print("🔨 Setting up tables in target database...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables 'users' and 'resumes_llm' are ready!")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

    return True


if __name__ == "__main__":
    setup_database()

