"""
Image Similarity Visualization
Calculate and visualize cosine similarity between product images.
"""

import os
from pathlib import Path
import numpy as np
import csv
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec


class SimilarityAnalyzer:
    """Analyze and visualize image similarities using embeddings."""

    def __init__(self, embeddings_csv='embeddings/all_embeddings.csv',
                 dataset_dir='dataset'):
        """
        Initialize similarity analyzer.

        Args:
            embeddings_csv (str): Path to embeddings CSV file
            dataset_dir (str): Path to dataset directory
        """
        self.embeddings_csv = embeddings_csv
        self.dataset_dir = dataset_dir

        print("📊 Loading embeddings...")
        self.data = self._load_embeddings()
        print(f"✓ Loaded {len(self.data)} image embeddings")
        print()

    def _load_embeddings(self):
        """Load embeddings from CSV file."""
        data = []

        with open(self.embeddings_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)  # Skip header

            for row in reader:
                image_path = row[0]
                class_name = row[1]
                embedding = np.array([float(x) for x in row[2:]])

                data.append({
                    'image_path': image_path,
                    'class_name': class_name,
                    'embedding': embedding
                })

        return data

    def get_embedding_by_path(self, image_path):
        """
        Get embedding for an image by path.

        Args:
            image_path (str): Image path (relative to dataset)

        Returns:
            np.ndarray: Embedding vector
        """
        for item in self.data:
            if item['image_path'] == image_path:
                return item['embedding']
        return None

    def get_embedding_by_index(self, index):
        """Get embedding by index."""
        return self.data[index]['embedding']

    def calculate_similarity(self, embedding1, embedding2):
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1 (np.ndarray): First embedding
            embedding2 (np.ndarray): Second embedding

        Returns:
            float: Cosine similarity (0 to 1)
        """
        # Reshape for sklearn
        emb1 = embedding1.reshape(1, -1)
        emb2 = embedding2.reshape(1, -1)

        similarity = cosine_similarity(emb1, emb2)[0][0]
        return similarity

    def find_similar_images(self, query_index, top_k=5):
        """
        Find most similar images to query image.

        Args:
            query_index (int): Index of query image
            top_k (int): Number of similar images to return

        Returns:
            list: List of (index, similarity) tuples
        """
        query_embedding = self.get_embedding_by_index(query_index)

        similarities = []
        for i, item in enumerate(self.data):
            if i == query_index:
                continue  # Skip self

            similarity = self.calculate_similarity(query_embedding, item['embedding'])
            similarities.append((i, similarity))

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def visualize_two_images(self, index1, index2, save_path=None):
        """
        Visualize two images and their similarity.

        Args:
            index1 (int): First image index
            index2 (int): Second image index
            save_path (str): Optional path to save figure
        """
        # Get data
        item1 = self.data[index1]
        item2 = self.data[index2]

        # Calculate similarity
        similarity = self.calculate_similarity(item1['embedding'], item2['embedding'])

        # Load images
        img1_path = Path(self.dataset_dir) / item1['image_path']
        img2_path = Path(self.dataset_dir) / item2['image_path']

        img1 = Image.open(img1_path).convert('RGB')
        img2 = Image.open(img2_path).convert('RGB')

        # Create figure
        fig, axes = plt.subplots(1, 2, figsize=(12, 5))

        # Plot images
        axes[0].imshow(img1)
        axes[0].set_title(f"{item1['class_name']}\n{Path(item1['image_path']).name}", fontsize=10)
        axes[0].axis('off')

        axes[1].imshow(img2)
        axes[1].set_title(f"{item2['class_name']}\n{Path(item2['image_path']).name}", fontsize=10)
        axes[1].axis('off')

        # Overall title
        fig.suptitle(f"Cosine Similarity: {similarity:.4f}", fontsize=14, fontweight='bold')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Saved to {save_path}")

        plt.show()

    def visualize_similar_images(self, query_index, top_k=5, save_path=None):
        """
        Visualize query image and its most similar images.

        Args:
            query_index (int): Query image index
            top_k (int): Number of similar images to show
            save_path (str): Optional path to save figure
        """
        # Get query data
        query_item = self.data[query_index]

        # Find similar images
        similar = self.find_similar_images(query_index, top_k)

        # Create figure
        fig = plt.figure(figsize=(15, 4))
        gs = gridspec.GridSpec(1, top_k + 2, width_ratios=[1.2] + [0.2] + [1] * top_k)

        # Query image
        ax_query = fig.add_subplot(gs[0])
        query_img_path = Path(self.dataset_dir) / query_item['image_path']
        query_img = Image.open(query_img_path).convert('RGB')
        ax_query.imshow(query_img)
        ax_query.set_title(f"QUERY\n{query_item['class_name']}\n{Path(query_item['image_path']).name}",
                          fontsize=10, fontweight='bold', color='blue')
        ax_query.axis('off')

        # Arrow
        ax_arrow = fig.add_subplot(gs[1])
        ax_arrow.text(0.5, 0.5, '→', fontsize=40, ha='center', va='center')
        ax_arrow.axis('off')

        # Similar images
        for i, (sim_idx, sim_score) in enumerate(similar):
            ax = fig.add_subplot(gs[i + 2])

            sim_item = self.data[sim_idx]
            sim_img_path = Path(self.dataset_dir) / sim_item['image_path']
            sim_img = Image.open(sim_img_path).convert('RGB')

            ax.imshow(sim_img)
            ax.set_title(f"#{i+1} (sim: {sim_score:.4f})\n{sim_item['class_name']}\n{Path(sim_item['image_path']).name}",
                        fontsize=9)
            ax.axis('off')

        plt.suptitle(f"Top {top_k} Most Similar Images", fontsize=14, fontweight='bold')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Saved to {save_path}")

        plt.show()

    def create_similarity_matrix(self, class_name=None, save_path=None):
        """
        Create similarity matrix heatmap.

        Args:
            class_name (str): Optional - only include images from this class
            save_path (str): Optional path to save figure
        """
        # Filter by class if specified
        if class_name:
            filtered_data = [item for item in self.data if item['class_name'] == class_name]
        else:
            filtered_data = self.data

        if len(filtered_data) > 50:
            print(f"⚠ Too many images ({len(filtered_data)}). Showing first 50.")
            filtered_data = filtered_data[:50]

        # Extract embeddings
        embeddings = np.array([item['embedding'] for item in filtered_data])
        labels = [Path(item['image_path']).name for item in filtered_data]

        # Calculate similarity matrix
        sim_matrix = cosine_similarity(embeddings)

        # Plot
        fig, ax = plt.subplots(figsize=(12, 10))
        im = ax.imshow(sim_matrix, cmap='YlOrRd', aspect='auto', vmin=0, vmax=1)

        # Labels
        ax.set_xticks(range(len(labels)))
        ax.set_yticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=90, fontsize=8)
        ax.set_yticklabels(labels, fontsize=8)

        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Cosine Similarity', fontsize=12)

        # Title
        title = f"Similarity Matrix: {class_name}" if class_name else "Similarity Matrix (All Images)"
        plt.title(title, fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Saved to {save_path}")

        plt.show()

    def list_images(self):
        """List all images with their indices."""
        print("📋 Available Images:")
        print("=" * 80)
        print(f"{'Index':<8} {'Class':<30} {'Image':<40}")
        print("-" * 80)

        for i, item in enumerate(self.data):
            print(f"{i:<8} {item['class_name']:<30} {item['image_path']:<40}")

        print("=" * 80)
        print()


def main():
    """Main execution."""
    import argparse

    parser = argparse.ArgumentParser(description='Visualize image similarity using embeddings')
    parser.add_argument('--embeddings', type=str, default='embeddings/all_embeddings.csv',
                        help='Path to embeddings CSV')
    parser.add_argument('--dataset-dir', type=str, default='dataset',
                        help='Dataset directory')
    parser.add_argument('--mode', type=str, choices=['list', 'compare', 'similar', 'matrix'],
                        default='list',
                        help='Visualization mode')
    parser.add_argument('--query-idx', type=int, help='Query image index')
    parser.add_argument('--target-idx', type=int, help='Target image index (for compare mode)')
    parser.add_argument('--top-k', type=int, default=5, help='Number of similar images to show')
    parser.add_argument('--class-name', type=str, help='Filter by class (for matrix mode)')
    parser.add_argument('--output', type=str, help='Output file path')

    args = parser.parse_args()

    # Check if embeddings exist
    if not Path(args.embeddings).exists():
        print(f"❌ Error: Embeddings file not found: {args.embeddings}")
        print("   Please run extract_features.py first!")
        return

    # Initialize analyzer
    analyzer = SimilarityAnalyzer(embeddings_csv=args.embeddings, dataset_dir=args.dataset_dir)

    # Execute based on mode
    if args.mode == 'list':
        analyzer.list_images()

    elif args.mode == 'compare':
        if args.query_idx is None or args.target_idx is None:
            print("❌ Error: --query-idx and --target-idx required for compare mode")
            return

        print(f"Comparing images {args.query_idx} and {args.target_idx}...")
        analyzer.visualize_two_images(args.query_idx, args.target_idx, save_path=args.output)

    elif args.mode == 'similar':
        if args.query_idx is None:
            print("❌ Error: --query-idx required for similar mode")
            return

        print(f"Finding top {args.top_k} similar images to index {args.query_idx}...")
        analyzer.visualize_similar_images(args.query_idx, top_k=args.top_k, save_path=args.output)

    elif args.mode == 'matrix':
        print("Creating similarity matrix...")
        analyzer.create_similarity_matrix(class_name=args.class_name, save_path=args.output)

    print("\n✅ Visualization complete!")


if __name__ == "__main__":
    main()
