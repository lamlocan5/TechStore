FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Copy AI-image-search module (feature extractor)
COPY ../AI-image-search/extract_features.py ./AI-image-search/
COPY ../AI-image-search/embeddings/ ./AI-image-search/embeddings/
COPY ../AI-image-search/dataset/ ./AI-image-search/dataset/

# Environment variables
ENV SERVICE_PORT=8087
ENV SERVICE_HOST=0.0.0.0
ENV DATASET_DIR=/app/AI-image-search/dataset
ENV EMBEDDINGS_CSV=/app/AI-image-search/embeddings/all_embeddings.csv
ENV USE_GPU=false

# Expose port
EXPOSE 8087

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8087"]
