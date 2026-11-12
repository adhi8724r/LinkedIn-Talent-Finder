import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import engine

def migrate_users():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'recruiter';"))
        conn.execute(text("UPDATE users SET role = 'admin' WHERE role IS NULL OR role = 'recruiter';"))
        conn.commit()
        print("✅ users table updated with 'role' column, existing users promoted to 'admin'!")

if __name__ == "__main__":
    migrate_users()

