from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from config import settings

client = QdrantClient(url=settings.qdrant_host, timeout=2.0, check_compatibility=False)

COLLECTION_NAME = settings.qdrant_collection

def setup_qdrant():
    try:
        if not client.collection_exists(COLLECTION_NAME):
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=settings.embedding_dim,
                    distance=Distance.COSINE,
                )
            )
            print(f"✅ Qdrant collection '{COLLECTION_NAME}' created.")
        else:
            print(f"✅ Qdrant collection '{COLLECTION_NAME}' already exists.")
    except Exception as e:
        print(f"⚠️ Could not connect to Qdrant at {settings.qdrant_host}: {e}")
