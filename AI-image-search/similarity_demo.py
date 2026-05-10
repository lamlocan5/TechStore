"""
Photo Similarity Search Demo
Upload any photo and find the 10 most similar photos from the dataset.
"""

import os
import sys
from pathlib import Path
import numpy as np
import torch
import gradio as gr
from PIL import Image
import csv
from sklearn.metrics.pairwise import cosine_similarity

# Import from existing modules
from extract_features import FeatureExtractor

class SimilaritySearchEngine:
    """Photo similarity search engine using deep learning features."""

    def __init__(self, embeddings_csv='embeddings/all_embeddings.csv',
                 dataset_dir='dataset', model_name='resnet50'):
        """
        Initialize similarity search engine.

        Args:
            embeddings_csv (str): Path to pre-computed embeddings CSV
            dataset_dir (str): Path to dataset directory
            model_name (str): Model to use for feature extraction
        """
        self.dataset_dir = dataset_dir
        self.model_name = model_name

        print("🚀 Initializing Similarity Search Engine...")

        # Load feature extractor for new images
        print(f"📦 Loading {model_name} model...")
        self.extractor = FeatureExtractor(model_name=model_name, use_gpu=True)

        # Load pre-computed embeddings
        if Path(embeddings_csv).exists():
            print(f"📊 Loading pre-computed embeddings from {embeddings_csv}...")
            self.embeddings_data = self._load_embeddings(embeddings_csv)
            print(f"✅ Loaded {len(self.embeddings_data)} images from dataset")
        else:
            print(f"⚠ Warning: Embeddings file not found: {embeddings_csv}")
            print(f"   Please run extract_features.py first to generate embeddings!")
            self.embeddings_data = []

        print("✅ Initialization complete!\n")

    def _load_embeddings(self, csv_path):
        """Load pre-computed embeddings from CSV."""
        data = []

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)  # Skip header

            for row in reader:
                image_path = row[0]
                class_name = row[1]
                embedding = np.array([float(x) for x in row[2:]])

                # Verify image exists
                full_path = Path(self.dataset_dir) / image_path
                if full_path.exists():
                    data.append({
                        'image_path': image_path,
                        'full_path': str(full_path),
                        'class_name': class_name,
                        'embedding': embedding
                    })

        return data

    def extract_features_from_image(self, image):
        """
        Extract features from a PIL Image or image path.

        Args:
            image (PIL.Image or str): Input image

        Returns:
            np.ndarray: Feature vector
        """
        # Handle PIL Image or path
        if isinstance(image, str):
            image = Image.open(image).convert('RGB')
        elif not isinstance(image, Image.Image):
            raise ValueError("Image must be PIL Image or path string")

        # Save temporarily if needed for processing
        temp_path = Path("temp_query_image.jpg")
        image.save(temp_path)

        try:
            # Preprocess and extract features
            image_tensor = self.extractor.preprocess_image(temp_path)
            features = self.extractor.extract_features(image_tensor)

            # Normalize features
            features = self.extractor.normalize_features(features)

            return features
        finally:
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()

    def find_similar_images(self, query_image, top_k=10):
        """
        Find most similar images to the query image.

        Args:
            query_image (PIL.Image): Query image
            top_k (int): Number of similar images to return

        Returns:
            list: List of (image_path, similarity_score, class_name) tuples
        """
        if not self.embeddings_data:
            return []

        # Extract features from query image
        print("🔍 Extracting features from query image...")
        query_features = self.extract_features_from_image(query_image)
        query_features = query_features.reshape(1, -1)

        # Calculate similarities with all dataset images
        print(f"📊 Calculating similarities with {len(self.embeddings_data)} images...")
        similarities = []

        for item in self.embeddings_data:
            dataset_features = item['embedding'].reshape(1, -1)
            similarity = cosine_similarity(query_features, dataset_features)[0][0]

            similarities.append({
                'image_path': item['full_path'],
                'relative_path': item['image_path'],
                'class_name': item['class_name'],
                'similarity': float(similarity)
            })

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x['similarity'], reverse=True)

        # Return top k
        top_results = similarities[:top_k]

        print(f"✅ Found top {len(top_results)} similar images")
        return top_results


# Global search engine instance
search_engine = None

def initialize_search_engine():
    """Initialize the search engine (called once at startup)."""
    global search_engine
    if search_engine is None:
        search_engine = SimilaritySearchEngine(
            embeddings_csv='embeddings/all_embeddings.csv',
            dataset_dir='dataset',
            model_name='resnet50'
        )
    return search_engine


def search_similar_images(query_image, num_results=10):
    """
    Main function called by Gradio interface.

    Args:
        query_image (PIL.Image): Uploaded query image
        num_results (int): Number of results to return

    Returns:
        list: List of similar images with metadata
    """
    if query_image is None:
        return []

    try:
        # Initialize search engine if needed
        engine = initialize_search_engine()

        if not engine.embeddings_data:
            return []

        # Find similar images
        results = engine.find_similar_images(query_image, top_k=num_results)

        # Format results for Gradio Gallery
        gallery_images = []
        for i, result in enumerate(results):
            img = Image.open(result['image_path'])
            caption = f"#{i+1}: {result['class_name']}\nSimilarity: {result['similarity']:.4f}"
            gallery_images.append((img, caption))

        return gallery_images

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def create_demo_interface():
    """Create and configure the Gradio interface."""

    # Custom CSS for better styling
    custom_css = """
    .gradio-container {
        font-family: 'Arial', sans-serif;
    }
    .main-header {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    """

    # Create interface
    with gr.Blocks(css=custom_css, title="Photo Similarity Search") as demo:

        # Header
        gr.HTML("""
        <div class="main-header">
            <h1>🔍 Photo Similarity Search Demo</h1>
            <p>Upload any photo to find the 10 most similar photos from our dataset</p>
        </div>
        """)

        with gr.Row():
            with gr.Column(scale=1):
                # Input section
                gr.Markdown("### 📤 Upload Your Photo")
                input_image = gr.Image(
                    label="Query Image",
                    type="pil",
                    height=400
                )

                num_results = gr.Slider(
                    minimum=1,
                    maximum=20,
                    value=10,
                    step=1,
                    label="Number of Results",
                    info="How many similar images to find"
                )

                search_btn = gr.Button("🔍 Find Similar Images", variant="primary", size="lg")

                gr.Markdown("""
                ### ℹ️ How it works:
                1. Upload any photo using the image box above
                2. Adjust the number of results if needed
                3. Click "Find Similar Images"
                4. The system will extract deep learning features using ResNet50
                5. Compare with all images in the dataset using cosine similarity
                6. Display the most similar images with similarity scores

                ### 📊 Dataset Info:
                - The system searches through a dataset of laptop product images
                - Features are extracted using a pre-trained ResNet50 model
                - Similarity is measured using cosine similarity
                """)

            with gr.Column(scale=2):
                # Output section
                gr.Markdown("### 🎯 Most Similar Images")
                output_gallery = gr.Gallery(
                    label="Similar Images",
                    show_label=False,
                    elem_id="gallery",
                    columns=5,
                    rows=2,
                    object_fit="contain",
                    height="auto"
                )

        # Examples section
        gr.Markdown("### 💡 Try These Examples")

        # Find some example images from dataset
        example_images = []
        dataset_path = Path('dataset')
        if dataset_path.exists():
            # Get a few sample images
            for product_folder in sorted(dataset_path.iterdir())[:3]:
                if product_folder.is_dir():
                    images = list(product_folder.glob('*.jpg'))[:1]
                    if images:
                        example_images.append([str(images[0]), 10])

        if example_images:
            gr.Examples(
                examples=example_images,
                inputs=[input_image, num_results],
                outputs=output_gallery,
                fn=search_similar_images,
                cache_examples=False
            )

        # Set up event handler
        search_btn.click(
            fn=search_similar_images,
            inputs=[input_image, num_results],
            outputs=output_gallery
        )

        # Footer
        gr.Markdown("""
        ---
        ### 🛠️ Technical Details
        - **Model**: ResNet50 (pre-trained on ImageNet)
        - **Feature Dimension**: 2048
        - **Similarity Metric**: Cosine Similarity
        - **Preprocessing**: 224x224 resize, ImageNet normalization

        ### 📝 Notes
        - First search may take longer as the model loads into memory
        - GPU acceleration is used if available
        - All images are normalized before comparison for better results
        """)

    return demo


def main():
    """Main function to run the demo."""
    print("=" * 80)
    print("🚀 Starting Photo Similarity Search Demo")
    print("=" * 80)
    print()

    # Check if embeddings exist
    embeddings_path = Path('embeddings/all_embeddings.csv')
    if not embeddings_path.exists():
        print("❌ ERROR: Embeddings not found!")
        print(f"   Expected location: {embeddings_path.absolute()}")
        print()
        print("📝 To generate embeddings, run:")
        print("   python extract_features.py")
        print()
        return

    # Check if dataset exists
    dataset_path = Path('dataset')
    if not dataset_path.exists() or not any(dataset_path.iterdir()):
        print("⚠ WARNING: Dataset directory is empty or missing!")
        print(f"   Expected location: {dataset_path.absolute()}")
        print()

    # Initialize search engine
    print("🔧 Pre-loading search engine...")
    initialize_search_engine()
    print()

    # Create and launch interface
    print("🌐 Creating web interface...")
    demo = create_demo_interface()

    print()
    print("=" * 80)
    print("✅ Demo is ready!")
    print("=" * 80)
    print("🌐 The interface will open in your browser automatically")
    print("📍 Or visit: http://localhost:7860")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 80)
    print()

    # Launch with options
    demo.launch(
        server_name="0.0.0.0",  # Allow external access
        server_port=7860,
        share=False,  # Set to True to create public link
        inbrowser=True  # Open browser automatically
    )


if __name__ == "__main__":
    main()
