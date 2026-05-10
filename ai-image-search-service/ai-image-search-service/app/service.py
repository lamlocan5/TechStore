"""
Image Search Service - Core business logic
Stores product_id with embeddings, returns product_id on search
"""
import io
import pickle
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import httpx
from sklearn.metrics.pairwise import cosine_similarity

from . import config


class FeatureExtractor:
    """Extract features using pre-trained CNN models"""

    def __init__(self, model_name: str = 'resnet50', use_gpu: bool = True):
        self.model_name = model_name
        self.device = torch.device('cuda' if use_gpu and torch.cuda.is_available() else 'cpu')

        print(f"Initializing {model_name} on {self.device}...")

        # Load pre-trained model
        self.model = self._load_model()
        self.model.eval()

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((config.IMAGE_SIZE, config.IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        print(f"Model loaded. Feature dimension: {self.get_feature_dim()}")

    def _load_model(self) -> nn.Module:
        """Load and modify pre-trained model to extract features"""
        if self.model_name == 'resnet50':
            model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
            model = nn.Sequential(*list(model.children())[:-1])
        elif self.model_name == 'resnet101':
            model = models.resnet101(weights=models.ResNet101_Weights.IMAGENET1K_V1)
            model = nn.Sequential(*list(model.children())[:-1])
        else:
            raise ValueError(f"Unknown model: {self.model_name}")

        return model.to(self.device)

    def get_feature_dim(self) -> int:
        """Get feature dimension"""
        if 'resnet50' in self.model_name or 'resnet101' in self.model_name:
            return 2048
        return 2048

    def extract_from_image(self, image: Image.Image) -> np.ndarray:
        """Extract features from PIL Image"""
        image = image.convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            features = self.model(image_tensor)
            features = features.view(features.size(0), -1)
            features = features.cpu().numpy()[0]

        # L2 normalize
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm

        return features

    def extract_from_url(self, url: str) -> np.ndarray:
        """Download image from URL and extract features"""
        response = httpx.get(url, timeout=30.0, follow_redirects=True)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content))
        return self.extract_from_image(image)


class ProductIndex:
    """
    Index storing product embeddings
    Structure: {product_id: [embedding1, embedding2, ...]}
    """

    def __init__(self):
        self.index: Dict[int, List[np.ndarray]] = {}
        self._flat_embeddings: Optional[np.ndarray] = None
        self._flat_product_ids: Optional[List[int]] = None
        self._needs_rebuild = True

    def add_product(self, product_id: int, embeddings: List[np.ndarray]) -> None:
        """Add or update product embeddings"""
        self.index[product_id] = embeddings
        self._needs_rebuild = True

    def remove_product(self, product_id: int) -> bool:
        """Remove product from index"""
        if product_id in self.index:
            del self.index[product_id]
            self._needs_rebuild = True
            return True
        return False

    def _rebuild_flat_index(self) -> None:
        """Rebuild flattened index for fast search"""
        if not self._needs_rebuild:
            return

        all_embeddings = []
        all_product_ids = []

        for product_id, embeddings in self.index.items():
            for emb in embeddings:
                all_embeddings.append(emb)
                all_product_ids.append(product_id)

        if all_embeddings:
            self._flat_embeddings = np.array(all_embeddings)
            self._flat_product_ids = all_product_ids
        else:
            self._flat_embeddings = None
            self._flat_product_ids = None

        self._needs_rebuild = False

    def search(self, query_embedding: np.ndarray, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Search for similar products

        Returns: List of (product_id, similarity) tuples, deduplicated by product_id
        """
        self._rebuild_flat_index()

        if self._flat_embeddings is None or len(self._flat_embeddings) == 0:
            return []

        # Calculate similarities
        query = query_embedding.reshape(1, -1)
        similarities = cosine_similarity(query, self._flat_embeddings)[0]

        # Get top results (may have duplicates for same product)
        top_indices = np.argsort(similarities)[::-1]

        # Deduplicate by product_id, keeping highest similarity
        seen_products = {}
        for idx in top_indices:
            product_id = self._flat_product_ids[idx]
            similarity = float(similarities[idx])

            if product_id not in seen_products:
                seen_products[product_id] = similarity

            if len(seen_products) >= top_k:
                break

        # Sort by similarity descending
        results = sorted(seen_products.items(), key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def get_stats(self) -> Dict:
        """Get index statistics"""
        total_images = sum(len(embs) for embs in self.index.values())
        return {
            'total_products': len(self.index),
            'total_images': total_images
        }

    def save(self, path: Path) -> None:
        """Save index to file"""
        with open(path, 'wb') as f:
            pickle.dump(self.index, f)
        print(f"Index saved to {path}")

    def load(self, path: Path) -> bool:
        """Load index from file"""
        if not path.exists():
            return False

        with open(path, 'rb') as f:
            self.index = pickle.load(f)
        self._needs_rebuild = True
        print(f"Index loaded from {path}: {len(self.index)} products")
        return True


class ImageSearchService:
    """Main service class"""

    _instance: Optional['ImageSearchService'] = None

    def __init__(self):
        self.extractor: Optional[FeatureExtractor] = None
        self.index: ProductIndex = ProductIndex()
        self.is_initialized = False

    @classmethod
    def get_instance(cls) -> 'ImageSearchService':
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def initialize(self) -> bool:
        """Initialize the service"""
        if self.is_initialized:
            return True

        try:
            print("Initializing Image Search Service...")

            # Load feature extractor
            self.extractor = FeatureExtractor(
                model_name=config.MODEL_NAME,
                use_gpu=config.USE_GPU
            )

            # Load existing index if available
            if config.INDEX_FILE.exists():
                self.index.load(config.INDEX_FILE)

            self.is_initialized = True
            print("Image Search Service initialized!")
            return True

        except Exception as e:
            print(f"Failed to initialize: {e}")
            return False

    def index_product(self, product_id: int, image_urls: List[str]) -> Tuple[int, int]:
        """
        Index product images

        Args:
            product_id: Product ID from product-service
            image_urls: List of image URLs to index

        Returns:
            Tuple of (images_indexed, images_failed)
        """
        if not self.is_initialized:
            self.initialize()

        embeddings = []
        failed = 0

        for url in image_urls:
            try:
                embedding = self.extractor.extract_from_url(url)
                embeddings.append(embedding)
            except Exception as e:
                print(f"Failed to index image {url}: {e}")
                failed += 1

        if embeddings:
            self.index.add_product(product_id, embeddings)
            self._save_index()

        return len(embeddings), failed

    def remove_product(self, product_id: int) -> bool:
        """Remove product from index"""
        removed = self.index.remove_product(product_id)
        if removed:
            self._save_index()
        return removed

    def search(self, image: Image.Image, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Search for similar products

        Args:
            image: Query image (PIL Image)
            top_k: Number of results

        Returns:
            List of (product_id, similarity) tuples
        """
        if not self.is_initialized:
            self.initialize()

        top_k = min(top_k, config.MAX_TOP_K)

        # Extract features from query image
        query_embedding = self.extractor.extract_from_image(image)

        # Search index
        return self.index.search(query_embedding, top_k)

    def _save_index(self) -> None:
        """Save index to disk"""
        self.index.save(config.INDEX_FILE)

    def get_stats(self) -> Dict:
        """Get service statistics"""
        stats = self.index.get_stats()
        stats['model_name'] = config.MODEL_NAME
        stats['feature_dimension'] = self.extractor.get_feature_dim() if self.extractor else 0
        return stats

    def get_health(self) -> Dict:
        """Get service health"""
        return {
            'status': 'healthy' if self.is_initialized else 'initializing',
            'model_loaded': self.extractor is not None,
            'index_loaded': len(self.index.index) > 0,
            'gpu_available': torch.cuda.is_available()
        }


def get_search_service() -> ImageSearchService:
    """Get the image search service instance"""
    return ImageSearchService.get_instance()
