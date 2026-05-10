"""
AI Image Search Service - FastAPI Application

Provides REST API for:
- Indexing product images (called by product-service)
- Searching similar products by image (returns product_id + similarity)
"""
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from . import config
from .models import (
    ApiResponse,
    IndexRequest, IndexResult,
    BulkIndexRequest, BulkIndexResult,
    SearchResult, SimilarProduct,
    IndexStats, HealthStatus
)
from .service import get_search_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("Starting AI Image Search Service...")
    service = get_search_service()
    service.initialize()
    print("Service ready!")
    yield
    print("Shutting down AI Image Search Service...")


app = FastAPI(
    title="AI Image Search Service",
    description="Product image similarity search using deep learning. "
                "Product-service indexes images, frontend searches by image.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Health & Stats Endpoints ==============

@app.get("/api/image-search/health", response_model=ApiResponse[HealthStatus])
async def health_check():
    """Check service health status"""
    service = get_search_service()
    health = service.get_health()

    return ApiResponse(
        code=1000,
        message="Service is running",
        result=HealthStatus(**health)
    )


@app.get("/api/image-search/stats", response_model=ApiResponse[IndexStats])
async def get_stats():
    """Get index statistics"""
    service = get_search_service()
    stats = service.get_stats()

    return ApiResponse(
        code=1000,
        message="Statistics retrieved successfully",
        result=IndexStats(**stats)
    )


# ============== Indexing Endpoints (Called by Product-Service) ==============

@app.post("/api/image-search/index", response_model=ApiResponse[IndexResult])
async def index_product(request: IndexRequest):
    """
    Index product images (called by product-service)

    - **product_id**: Product ID from database
    - **image_urls**: List of image URLs to index
    """
    if not request.image_urls:
        raise HTTPException(status_code=400, detail="No image URLs provided")

    try:
        service = get_search_service()
        indexed, failed = service.index_product(request.product_id, request.image_urls)

        result = IndexResult(
            product_id=request.product_id,
            images_indexed=indexed,
            images_failed=failed
        )

        return ApiResponse(
            code=1000,
            message=f"Indexed {indexed} images for product {request.product_id}",
            result=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@app.post("/api/image-search/index/bulk", response_model=ApiResponse[BulkIndexResult])
async def bulk_index_products(request: BulkIndexRequest):
    """
    Bulk index multiple products (called by product-service for initial sync)

    - **products**: List of products with their image URLs
    """
    if not request.products:
        raise HTTPException(status_code=400, detail="No products provided")

    service = get_search_service()
    results = []
    successful = 0
    failed = 0

    for product in request.products:
        try:
            indexed, fail_count = service.index_product(product.product_id, product.image_urls)
            results.append(IndexResult(
                product_id=product.product_id,
                images_indexed=indexed,
                images_failed=fail_count
            ))
            if indexed > 0:
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"Failed to index product {product.product_id}: {e}")
            results.append(IndexResult(
                product_id=product.product_id,
                images_indexed=0,
                images_failed=len(product.image_urls)
            ))
            failed += 1

    return ApiResponse(
        code=1000,
        message=f"Bulk indexing complete: {successful} successful, {failed} failed",
        result=BulkIndexResult(
            total_products=len(request.products),
            successful=successful,
            failed=failed,
            results=results
        )
    )


@app.delete("/api/image-search/index/{product_id}", response_model=ApiResponse[bool])
async def remove_product(product_id: int):
    """
    Remove product from index (called by product-service when product is deleted)

    - **product_id**: Product ID to remove
    """
    service = get_search_service()
    removed = service.remove_product(product_id)

    if removed:
        return ApiResponse(
            code=1000,
            message=f"Product {product_id} removed from index",
            result=True
        )
    else:
        return ApiResponse(
            code=1001,
            message=f"Product {product_id} not found in index",
            result=False
        )


# ============== Search Endpoints (Called by Frontend) ==============

@app.post("/api/image-search/search", response_model=ApiResponse[SearchResult])
async def search_by_image(
    file: UploadFile = File(..., description="Image file to search"),
    top_k: int = Query(default=10, ge=1, le=50, description="Number of results")
):
    """
    Search for similar products by uploading an image

    Returns list of product_id + similarity score.
    Frontend should call product-service to get full product details.

    - **file**: Image file (JPEG, PNG, etc.)
    - **top_k**: Number of results (1-50, default: 10)
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        service = get_search_service()
        results = service.search(image, top_k=top_k)

        similar_products = [
            SimilarProduct(product_id=pid, similarity=round(sim, 4))
            for pid, sim in results
        ]

        return ApiResponse(
            code=1000,
            message=f"Found {len(similar_products)} similar products",
            result=SearchResult(
                query_processed=True,
                total_results=len(similar_products),
                results=similar_products
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/api/image-search/search-url", response_model=ApiResponse[SearchResult])
async def search_by_url(
    image_url: str,
    top_k: int = Query(default=10, ge=1, le=50, description="Number of results")
):
    """
    Search for similar products using image URL

    - **image_url**: URL of the image to search
    - **top_k**: Number of results (1-50, default: 10)
    """
    try:
        service = get_search_service()

        # Download and process image
        import httpx
        response = httpx.get(image_url, timeout=30.0, follow_redirects=True)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert("RGB")

        results = service.search(image, top_k=top_k)

        similar_products = [
            SimilarProduct(product_id=pid, similarity=round(sim, 4))
            for pid, sim in results
        ]

        return ApiResponse(
            code=1000,
            message=f"Found {len(similar_products)} similar products",
            result=SearchResult(
                query_processed=True,
                total_results=len(similar_products),
                results=similar_products
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.SERVICE_HOST,
        port=config.SERVICE_PORT,
        reload=True
    )
