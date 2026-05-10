"""
Feature Extraction using ResNet50
Extracts deep learning features from product images for similarity search and retrieval.
"""

import os
import sys
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import csv
from collections import defaultdict
import time

# Configuration
DATASET_DIR = "dataset"
OUTPUT_DIR = "embeddings"
MODEL_NAME = "resnet50"
BATCH_SIZE = 32
IMAGE_SIZE = 224
USE_GPU = True
NORMALIZE_EMBEDDINGS = True

# Statistics
stats = {
    'total_images': 0,
    'processed': 0,
    'failed': 0,
    'by_product': defaultdict(lambda: {'processed': 0, 'failed': 0}),
    'failed_files': []
}


class FeatureExtractor:
    """Extract features using pre-trained CNN models."""

    def __init__(self, model_name='resnet50', use_gpu=True):
        """
        Initialize feature extractor.

        Args:
            model_name (str): Model to use (resnet50, resnet101, etc.)
            use_gpu (bool): Use GPU if available
        """
        self.model_name = model_name
        self.device = torch.device('cuda' if use_gpu and torch.cuda.is_available() else 'cpu')

        print(f"🔧 Initializing {model_name}...")
        print(f"   Device: {self.device}")

        # Load pre-trained model
        self.model = self._load_model()
        self.model.eval()

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        print(f"   ✓ Model loaded successfully")
        print(f"   ✓ Feature dimension: {self.get_feature_dim()}")
        print()

    def _load_model(self):
        """Load and modify pre-trained model to extract features."""
        if self.model_name == 'resnet50':
            model = models.resnet50(pretrained=True)
            # Remove final classification layer
            model = nn.Sequential(*list(model.children())[:-1])
        elif self.model_name == 'resnet101':
            model = models.resnet101(pretrained=True)
            model = nn.Sequential(*list(model.children())[:-1])
        elif self.model_name == 'resnet34':
            model = models.resnet34(pretrained=True)
            model = nn.Sequential(*list(model.children())[:-1])
        elif self.model_name == 'vgg16':
            model = models.vgg16(pretrained=True)
            model.classifier = nn.Sequential(*list(model.classifier.children())[:-1])
        else:
            raise ValueError(f"Unknown model: {self.model_name}")

        return model.to(self.device)

    def get_feature_dim(self):
        """Get feature dimension."""
        if 'resnet50' in self.model_name or 'resnet101' in self.model_name:
            return 2048
        elif 'resnet34' in self.model_name:
            return 512
        elif 'vgg16' in self.model_name:
            return 4096
        return None

    def preprocess_image(self, image_path):
        """
        Load and preprocess image.

        Args:
            image_path (Path): Path to image

        Returns:
            torch.Tensor: Preprocessed image tensor
        """
        try:
            image = Image.open(image_path).convert('RGB')
            return self.transform(image)
        except Exception as e:
            raise RuntimeError(f"Failed to load image: {str(e)}")

    def extract_features(self, image_tensor):
        """
        Extract features from image tensor.

        Args:
            image_tensor (torch.Tensor): Preprocessed image tensor

        Returns:
            np.ndarray: Feature vector
        """
        with torch.no_grad():
            # Add batch dimension if needed
            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)

            # Move to device
            image_tensor = image_tensor.to(self.device)

            # Extract features
            features = self.model(image_tensor)

            # Flatten
            features = features.view(features.size(0), -1)

            # Move to CPU and convert to numpy
            features = features.cpu().numpy()

            return features[0]

    def extract_batch(self, image_tensors):
        """
        Extract features from batch of images.

        Args:
            image_tensors (torch.Tensor): Batch of preprocessed images

        Returns:
            np.ndarray: Feature vectors
        """
        with torch.no_grad():
            image_tensors = image_tensors.to(self.device)
            features = self.model(image_tensors)
            features = features.view(features.size(0), -1)
            return features.cpu().numpy()

    def normalize_features(self, features):
        """
        L2 normalize features.

        Args:
            features (np.ndarray): Feature vector

        Returns:
            np.ndarray: Normalized feature vector
        """
        norm = np.linalg.norm(features)
        if norm == 0:
            return features
        return features / norm


def process_dataset(dataset_dir=DATASET_DIR, output_dir=OUTPUT_DIR, model_name=MODEL_NAME,
                   use_gpu=USE_GPU, normalize=NORMALIZE_EMBEDDINGS, batch_size=BATCH_SIZE):
    """
    Process entire dataset and extract features.

    Args:
        dataset_dir (str): Input dataset directory
        output_dir (str): Output embeddings directory
        model_name (str): Model name
        use_gpu (bool): Use GPU if available
        normalize (bool): L2 normalize embeddings
        batch_size (int): Batch size for processing

    Returns:
        dict: Processing statistics
    """
    dataset_path = Path(dataset_dir)
    output_path = Path(output_dir)

    if not dataset_path.exists():
        print(f"❌ Error: Dataset directory not found: {dataset_dir}")
        return None

    # Create output directory
    output_path.mkdir(exist_ok=True)

    print("🚀 Feature Extraction System")
    print("=" * 80)
    print(f"Dataset directory:    {dataset_path.absolute()}")
    print(f"Output directory:     {output_path.absolute()}")
    print(f"Model:                {model_name}")
    print(f"L2 Normalization:     {normalize}")
    print(f"Batch size:           {batch_size}")
    print("=" * 80)
    print()

    # Initialize feature extractor
    extractor = FeatureExtractor(model_name=model_name, use_gpu=use_gpu)

    # Find all product folders
    product_folders = [f for f in dataset_path.iterdir() if f.is_dir()]

    if not product_folders:
        print("⚠ No product folders found")
        return None

    print(f"📁 Found {len(product_folders)} product categories")
    print()

    # CSV data for all embeddings
    csv_data = []

    # Process each product folder
    start_time = time.time()

    for product_idx, product_folder in enumerate(sorted(product_folders), 1):
        product_name = product_folder.name

        # Find image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
        image_files = [f for f in product_folder.iterdir()
                      if f.is_file() and f.suffix.lower() in image_extensions]

        if not image_files:
            print(f"[{product_idx}/{len(product_folders)}] {product_name}")
            print(f"  ⊘ No images found")
            print()
            continue

        stats['total_images'] += len(image_files)

        print(f"[{product_idx}/{len(product_folders)}] {product_name}")
        print(f"  Images: {len(image_files)}")

        # Create output folder
        output_product_folder = output_path / product_name
        output_product_folder.mkdir(exist_ok=True)

        # Process each image
        for img_idx, image_file in enumerate(sorted(image_files), 1):
            try:
                print(f"  [{img_idx}/{len(image_files)}] {image_file.name} ", end="")

                # Preprocess image
                image_tensor = extractor.preprocess_image(image_file)

                # Extract features
                features = extractor.extract_features(image_tensor)

                # Normalize if requested
                if normalize:
                    features = extractor.normalize_features(features)

                # Save as .npy file
                output_filename = f"{image_file.stem}.npy"
                output_file = output_product_folder / output_filename
                np.save(output_file, features)

                # Add to CSV data
                relative_path = f"{product_name}/{image_file.name}"
                csv_row = [relative_path, product_name] + features.tolist()
                csv_data.append(csv_row)

                print(f"✓ (dim: {len(features)})")

                stats['processed'] += 1
                stats['by_product'][product_name]['processed'] += 1

            except Exception as e:
                print(f"✗ {str(e)}")
                stats['failed'] += 1
                stats['by_product'][product_name]['failed'] += 1
                stats['failed_files'].append({
                    'path': str(image_file),
                    'error': str(e)
                })

        print()

    # Save CSV file
    csv_file = output_path / 'all_embeddings.csv'
    print(f"💾 Saving embeddings CSV to: {csv_file}")

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Header
        feature_dim = extractor.get_feature_dim()
        header = ['image_path', 'class_name'] + [f'feat_{i}' for i in range(feature_dim)]
        writer.writerow(header)

        # Data
        writer.writerows(csv_data)

    elapsed_time = time.time() - start_time

    print(f"✓ CSV file saved with {len(csv_data)} rows")
    print()

    # Save metadata
    metadata = {
        'model': model_name,
        'feature_dim': feature_dim,
        'normalized': normalize,
        'total_images': stats['processed'],
        'image_size': IMAGE_SIZE,
        'elapsed_time_seconds': round(elapsed_time, 2)
    }

    metadata_file = output_path / 'metadata.txt'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        for key, value in metadata.items():
            f.write(f"{key}: {value}\n")

    print(f"📄 Metadata saved to: {metadata_file}")
    print()

    # Add timing to stats
    stats['elapsed_time'] = elapsed_time

    return stats


def print_summary(stats):
    """Print processing summary."""
    print("=" * 80)
    print("📊 EXTRACTION SUMMARY")
    print("=" * 80)
    print(f"Total images:         {stats['total_images']}")
    print(f"✓ Successfully processed: {stats['processed']}")
    print(f"✗ Failed:                 {stats['failed']}")

    if stats['total_images'] > 0:
        success_rate = (stats['processed'] / stats['total_images']) * 100
        print(f"Success rate:         {success_rate:.1f}%")

    if 'elapsed_time' in stats:
        elapsed = stats['elapsed_time']
        print(f"Elapsed time:         {elapsed:.2f} seconds")
        if stats['processed'] > 0:
            avg_time = elapsed / stats['processed']
            print(f"Avg time per image:   {avg_time:.3f} seconds")

    print()

    # Per-product breakdown
    if stats['by_product']:
        print("📦 PER-PRODUCT BREAKDOWN")
        print("-" * 80)
        print(f"{'Product':<40} {'Processed':>12} {'Failed':>10}")
        print("-" * 80)

        for product_name, product_stats in sorted(stats['by_product'].items()):
            print(f"{product_name:<40} {product_stats['processed']:>12} {product_stats['failed']:>10}")

        print()

    # Failed files
    if stats['failed_files']:
        print("❌ FAILED FILES")
        print("-" * 80)
        for failed in stats['failed_files'][:10]:
            print(f"  {failed['path']}")
            print(f"    Error: {failed['error']}")
        if len(stats['failed_files']) > 10:
            print(f"  ... and {len(stats['failed_files']) - 10} more")
        print()

    print("=" * 80)


def main():
    """Main execution."""
    import argparse
     # Update global config
    global DATASET_DIR, OUTPUT_DIR, MODEL_NAME, BATCH_SIZE, USE_GPU, NORMALIZE_EMBEDDINGS
    parser = argparse.ArgumentParser(description='Extract features from images using pre-trained CNN')
    parser.add_argument('--dataset-dir', type=str, default=DATASET_DIR,
                        help=f'Dataset directory (default: {DATASET_DIR})')
    parser.add_argument('--output-dir', type=str, default=OUTPUT_DIR,
                        help=f'Output directory (default: {OUTPUT_DIR})')
    parser.add_argument('--model', type=str, default=MODEL_NAME,
                        choices=['resnet50', 'resnet101', 'resnet34', 'vgg16'],
                        help=f'Model to use (default: {MODEL_NAME})')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE,
                        help=f'Batch size (default: {BATCH_SIZE})')
    parser.add_argument('--no-gpu', action='store_true',
                        help='Disable GPU usage')
    parser.add_argument('--no-normalize', action='store_true',
                        help='Disable L2 normalization')

    args = parser.parse_args()

   

    DATASET_DIR = args.dataset_dir
    OUTPUT_DIR = args.output_dir
    MODEL_NAME = args.model
    BATCH_SIZE = args.batch_size
    USE_GPU = not args.no_gpu
    NORMALIZE_EMBEDDINGS = not args.no_normalize

    # Process dataset
    process_stats = process_dataset(
        dataset_dir=DATASET_DIR,
        output_dir=OUTPUT_DIR,
        model_name=MODEL_NAME,
        use_gpu=USE_GPU,
        normalize=NORMALIZE_EMBEDDINGS,
        batch_size=BATCH_SIZE
    )

    if process_stats:
        print_summary(process_stats)
        print("✅ Feature extraction complete!")
        print(f"📂 Embeddings saved to: {OUTPUT_DIR}/")
        print(f"📄 CSV file: {OUTPUT_DIR}/all_embeddings.csv")


if __name__ == "__main__":
    main()
