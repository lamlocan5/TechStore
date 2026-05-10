"""
Configuration settings for AI Image Search Service
"""
import os
from pathlib import Path

# Service configuration
SERVICE_NAME = "ai-image-search-service"
SERVICE_PORT = int(os.getenv("SERVICE_PORT", "8087"))
SERVICE_HOST = os.getenv("SERVICE_HOST", "0.0.0.0")

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
INDEX_FILE = DATA_DIR / "product_index.pkl"

# Model configuration
MODEL_NAME = os.getenv("MODEL_NAME", "resnet50")
USE_GPU = os.getenv("USE_GPU", "true").lower() == "true"
IMAGE_SIZE = 224

# Search configuration
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", "10"))
MAX_TOP_K = int(os.getenv("MAX_TOP_K", "50"))

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)
