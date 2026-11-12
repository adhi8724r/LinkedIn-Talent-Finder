import os
from pydantic_settings import BaseSettings, SettingsConfigDict

DOTENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=DOTENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    secret_key: str = "default_secret_key"
    postgres_url: str = "postgresql://postgres:qwerty@localhost:5433/resume_db"
    qdrant_host: str = "http://localhost:6333"
    qdrant_collection: str = "resume_vectors"
    embedding_dim: int = 768
    api: str = ""

settings = Settings()
