"""
Pydantic models for API request/response
"""
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel, Field

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response format matching other services"""
    code: int = Field(default=1000, description="Response code (1000 = success)")
    message: Optional[str] = Field(default=None, description="Response message")
    result: Optional[T] = Field(default=None, description="Response data")


# ============== Indexing Models ==============

class IndexRequest(BaseModel):
    """Request to index product images"""
    product_id: int = Field(..., description="Product ID from product-service")
    image_urls: List[str] = Field(..., description="List of image URLs to index")


class IndexResult(BaseModel):
    """Result of indexing operation"""
    product_id: int = Field(..., description="Product ID that was indexed")
    images_indexed: int = Field(..., description="Number of images successfully indexed")
    images_failed: int = Field(default=0, description="Number of images that failed to index")


class BulkIndexRequest(BaseModel):
    """Request to index multiple products at once"""
    products: List[IndexRequest] = Field(..., description="List of products to index")


class BulkIndexResult(BaseModel):
    """Result of bulk indexing operation"""
    total_products: int = Field(..., description="Total products processed")
    successful: int = Field(..., description="Products successfully indexed")
    failed: int = Field(..., description="Products that failed")
    results: List[IndexResult] = Field(default=[], description="Individual results")


# ============== Search Models ==============

class SimilarProduct(BaseModel):
    """Similar product result - returns only product_id and similarity"""
    product_id: int = Field(..., description="Product ID from database")
    similarity: float = Field(..., description="Cosine similarity score (0-1)")


class SearchResult(BaseModel):
    """Image search result"""
    query_processed: bool = Field(..., description="Whether query was processed successfully")
    total_results: int = Field(..., description="Number of results returned")
    results: List[SimilarProduct] = Field(default=[], description="List of similar products")


# ============== Status Models ==============

class IndexStats(BaseModel):
    """Index statistics"""
    total_products: int = Field(..., description="Total number of indexed products")
    total_images: int = Field(..., description="Total number of indexed images")
    model_name: str = Field(..., description="Feature extraction model name")
    feature_dimension: int = Field(..., description="Feature vector dimension")


class HealthStatus(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether ML model is loaded")
    index_loaded: bool = Field(..., description="Whether index is loaded")
    gpu_available: bool = Field(..., description="Whether GPU is available")
