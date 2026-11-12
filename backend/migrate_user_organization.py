"""
Migration script to add 'organization' column to 'users' table.
"""
from sqlalchemy import text
from db import engine

def run_migration():
    print("Connecting to PostgreSQL database...")
    with engine.connect() as conn:
        print("Checking if 'organization' column exists in 'users' table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR DEFAULT 'Independent';"))
        conn.commit()
        print("Migration complete. 'organization' column added.")

if __name__ == "__main__":
    run_migration()
