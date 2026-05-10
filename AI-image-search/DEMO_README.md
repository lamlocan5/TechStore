# 🔍 Photo Similarity Search Demo

A web-based demo application that finds the 10 most similar photos from your dataset when you upload any photo.

![Demo Screenshot](https://img.shields.io/badge/Gradio-Interface-orange) ![Python](https://img.shields.io/badge/Python-3.7+-blue) ![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-red)

## ✨ Features

- **🖼️ Upload Any Photo**: Simply drag and drop or upload any image
- **🔍 Find Similar Images**: Automatically finds the 10 most similar photos from your dataset
- **📊 Visual Results**: Display similar images in a beautiful gallery with similarity scores
- **⚡ Fast Search**: Uses pre-computed embeddings for quick similarity search
- **🎯 Accurate Results**: Powered by ResNet50 deep learning model trained on ImageNet
- **💻 GPU Accelerated**: Automatically uses GPU if available for faster processing

## 🚀 Quick Start

### Prerequisites

1. **Python 3.7+** installed on your system
2. **Dataset** with product images in the `dataset/` directory
3. **Pre-computed embeddings** generated from your dataset

### Installation

1. Install required dependencies:

```bash
# Install Gradio (if not already installed)
pip install gradio>=3.50.0

# Or install all requirements
pip install -r requirements.txt
```

### Generate Embeddings (First Time Only)

Before running the demo, you need to generate embeddings for your dataset:

```bash
# Extract features from all images in dataset
python extract_features.py

# This will create:
# - embeddings/ directory with .npy files
# - embeddings/all_embeddings.csv with feature vectors
```

This process may take a few minutes depending on your dataset size and whether you have GPU acceleration.

### Run the Demo

```bash
python similarity_demo.py
```

The demo will:
1. Load the pre-trained ResNet50 model
2. Load pre-computed embeddings from your dataset
3. Start a web server at `http://localhost:7860`
4. Open your browser automatically

## 📖 How to Use

### Basic Usage

1. **Upload a Photo**:
   - Click on the image upload box
   - Drag and drop an image, or browse to select one
   - Any image format (JPG, PNG, WEBP, etc.) is supported

2. **Adjust Settings** (Optional):
   - Use the slider to change the number of results (1-20)
   - Default is 10 most similar images

3. **Search**:
   - Click the "🔍 Find Similar Images" button
   - Wait a few seconds for processing
   - Results will appear in the gallery below

4. **View Results**:
   - Each result shows the similar image
   - Similarity score (0.0 to 1.0, higher is more similar)
   - Product class/category name

### Example Workflow

```
Upload Photo → Adjust Results Count → Click Search → View Similar Images
```

## 🛠️ Technical Details

### Architecture

```
Query Image → ResNet50 Feature Extractor → Feature Vector (2048-dim)
                                                    ↓
                                          Cosine Similarity
                                                    ↓
Dataset Embeddings (Pre-computed) → Compare All → Top K Results
```

### Feature Extraction

- **Model**: ResNet50 (pre-trained on ImageNet)
- **Feature Dimension**: 2048-dimensional vector
- **Normalization**: L2 normalization for better similarity comparison
- **Image Size**: 224x224 pixels (automatically resized)
- **Preprocessing**: ImageNet mean/std normalization

### Similarity Metric

- **Algorithm**: Cosine Similarity
- **Range**: 0.0 (completely different) to 1.0 (identical)
- **Typical Results**:
  - > 0.9: Very similar (same product, different angle)
  - 0.7-0.9: Similar products (same category)
  - 0.5-0.7: Somewhat similar (related features)
  - < 0.5: Different products

## 📁 Project Structure

```
do_an/
├── similarity_demo.py          # Main demo application (THIS FILE)
├── extract_features.py         # Feature extraction script
├── requirements.txt            # Python dependencies
├── DEMO_README.md             # This readme
├── dataset/                   # Your image dataset
│   ├── product_1/
│   │   ├── img_01.jpg
│   │   └── img_02.jpg
│   └── product_2/
│       └── img_01.jpg
└── embeddings/                # Pre-computed features
    ├── all_embeddings.csv     # All feature vectors
    └── product_1/
        └── img_01.npy
```

## 🎮 Advanced Usage

### Custom Configuration

Edit the parameters in `similarity_demo.py`:

```python
search_engine = SimilaritySearchEngine(
    embeddings_csv='embeddings/all_embeddings.csv',  # Path to embeddings
    dataset_dir='dataset',                            # Dataset directory
    model_name='resnet50'                            # Model to use
)
```

### Available Models

You can change the model by modifying the `model_name` parameter:
- `resnet50` (default) - Good balance of speed and accuracy
- `resnet101` - Higher accuracy, slower
- `resnet34` - Faster, less accurate
- `vgg16` - Alternative architecture

### Create Public Link

To share the demo with others online:

```python
demo.launch(
    share=True  # Creates a temporary public URL
)
```

This will generate a public link like: `https://xxxxx.gradio.live`

### Change Port

To use a different port:

```python
demo.launch(
    server_port=8080  # Use port 8080 instead of 7860
)
```

## 🐛 Troubleshooting

### Error: "Embeddings not found"

**Problem**: The demo can't find pre-computed embeddings

**Solution**:
```bash
# Generate embeddings first
python extract_features.py
```

### Error: "Dataset directory is empty"

**Problem**: No images found in dataset folder

**Solution**:
- Ensure images are in `dataset/` directory
- Organize in subfolders by product/category
- Run dataset download script if needed

### Slow Performance

**Problem**: Image search takes too long

**Solutions**:
1. **Use GPU**: Ensure PyTorch can access your GPU
   ```bash
   python -c "import torch; print(torch.cuda.is_available())"
   ```

2. **Reduce Dataset Size**: Limit the number of images

3. **Use Lighter Model**: Switch to `resnet34` for faster processing

### Out of Memory Error

**Problem**: Not enough RAM or VRAM

**Solutions**:
1. Use CPU instead of GPU (set `use_gpu=False`)
2. Reduce batch size in feature extraction
3. Process fewer images at once

## 📊 Performance Metrics

Typical performance on a modern system:

| Operation | Time (CPU) | Time (GPU) |
|-----------|------------|------------|
| Model Loading | 2-3 seconds | 1-2 seconds |
| Feature Extraction (1 image) | 0.5-1 second | 0.1-0.2 seconds |
| Similarity Search (1000 images) | < 0.1 second | < 0.1 second |
| Total Search Time | 1-2 seconds | 0.3-0.5 seconds |

## 🔧 Customization Ideas

### 1. Add More Metadata

Display additional information with results:
- Product name
- Price
- Description
- Link to product page

### 2. Filter by Category

Allow users to search within specific product categories

### 3. Advanced Filters

Add sliders to filter results by:
- Minimum similarity threshold
- Specific color ranges
- Product attributes

### 4. Batch Upload

Allow uploading multiple images at once

### 5. Comparison Mode

Let users compare two images side-by-side

## 📚 Related Files

- **`extract_features.py`** - Generate embeddings from dataset
- **`visualize_similarity.py`** - Visualize similarity matrices
- **`README_FEATURE_EXTRACTION.md`** - Feature extraction documentation
- **`PROJECT_OVERVIEW.md`** - Complete project documentation

## 🤝 Contributing

To improve the demo:

1. Add new features to `similarity_demo.py`
2. Update this README with new instructions
3. Test thoroughly with different image types
4. Consider performance implications

## 📝 License

This demo is part of the laptop image similarity search project.

## 🙏 Acknowledgments

- **Gradio** - For the excellent web interface framework
- **PyTorch** - For deep learning capabilities
- **ResNet** - For the powerful feature extraction model
- **scikit-learn** - For similarity calculations

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Ensure all dependencies are installed
3. Verify your dataset structure is correct
4. Check that embeddings are generated properly

---

**Happy Searching! 🔍✨**

For more information, see the main project documentation.
