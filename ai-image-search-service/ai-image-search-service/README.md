# AI Image Search Service

Product image similarity search service using deep learning (ResNet50).

## Architecture

```
┌─────────────────┐      POST /index (product_id + image_urls)     ┌──────────────────────┐
│  Product-Service │ ──────────────────────────────────────────────► │  AI Image Search     │
│  (Source of Truth)│                                                │  Service             │
└─────────────────┘                                                  │                      │
                                                                     │  Stores:             │
┌─────────────────┐      POST /search (upload image)                 │  - product_id        │
│    Frontend     │ ──────────────────────────────────────────────► │  - embeddings        │
│                 │ ◄────────────────────────────────────────────── │                      │
└─────────────────┘      Returns: [{product_id, similarity}]         └──────────────────────┘
        │
        │  GET /products/{id} (get product details)
        ▼
┌─────────────────┐
│  Product-Service │
└─────────────────┘
```

## Key Principles

- **Product-service is the source of truth** - it pushes product_id + image URLs to this service
- **AI service only stores product_id** - never depends on slug, name, or other product data
- **Search returns product_id only** - frontend fetches full product details from product-service

## API Endpoints

### Indexing (Called by Product-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/image-search/index` | Index single product images |
| POST | `/api/image-search/index/bulk` | Bulk index multiple products |
| DELETE | `/api/image-search/index/{product_id}` | Remove product from index |

### Search (Called by Frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/image-search/search` | Search by image upload |
| POST | `/api/image-search/search-url` | Search by image URL |

### Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/image-search/health` | Health check |
| GET | `/api/image-search/stats` | Index statistics |

## Usage Examples

### 1. Product-Service: Index a Product

```bash
curl -X POST "http://localhost:8087/api/image-search/index" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 123,
    "image_urls": [
      "https://example.com/product/123/image1.jpg",
      "https://example.com/product/123/image2.jpg"
    ]
  }'
```

Response:
```json
{
  "code": 1000,
  "message": "Indexed 2 images for product 123",
  "result": {
    "product_id": 123,
    "images_indexed": 2,
    "images_failed": 0
  }
}
```

### 2. Product-Service: Bulk Index Products

```bash
curl -X POST "http://localhost:8087/api/image-search/index/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {"product_id": 1, "image_urls": ["https://example.com/p1.jpg"]},
      {"product_id": 2, "image_urls": ["https://example.com/p2.jpg"]}
    ]
  }'
```

### 3. Frontend: Search by Image

```bash
curl -X POST "http://localhost:8087/api/image-search/search" \
  -F "file=@laptop.jpg" \
  -F "top_k=10"
```

Response:
```json
{
  "code": 1000,
  "message": "Found 10 similar products",
  "result": {
    "query_processed": true,
    "total_results": 10,
    "results": [
      {"product_id": 123, "similarity": 0.9523},
      {"product_id": 456, "similarity": 0.8912},
      {"product_id": 789, "similarity": 0.8745}
    ]
  }
}
```

### 4. Frontend: Get Product Details

After receiving product_ids from search, frontend calls product-service:

```bash
curl "http://localhost:8083/product/products/123"
```

## Running the Service

### Quick Start (Windows)

```bash
start.bat
```

### Manual

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run service
python run.py
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| SERVICE_PORT | 8087 | Service port |
| SERVICE_HOST | 0.0.0.0 | Service host |
| DATA_DIR | ./data | Directory to store index |
| MODEL_NAME | resnet50 | Feature extraction model |
| USE_GPU | true | Use GPU if available |
| DEFAULT_TOP_K | 10 | Default search results |
| MAX_TOP_K | 50 | Maximum search results |

## Integration with Product-Service

Product-service should call AI image search service when:

1. **Product Created**: POST `/index` with product_id and image URLs
2. **Product Updated** (images changed): POST `/index` to re-index
3. **Product Deleted**: DELETE `/index/{product_id}`

Example integration in Java (Spring Boot):

```java
@Service
public class ImageSearchClient {
    private final RestTemplate restTemplate;

    public void indexProduct(Long productId, List<String> imageUrls) {
        var request = Map.of(
            "product_id", productId,
            "image_urls", imageUrls
        );
        restTemplate.postForObject(
            "http://localhost:8087/api/image-search/index",
            request,
            Object.class
        );
    }

    public void removeProduct(Long productId) {
        restTemplate.delete(
            "http://localhost:8087/api/image-search/index/" + productId
        );
    }
}
```

## API Documentation

- Swagger UI: http://localhost:8087/docs
- ReDoc: http://localhost:8087/redoc
