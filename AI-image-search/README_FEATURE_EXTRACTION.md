# Feature Extraction with ResNet50

Complete system for extracting deep learning features from product images using pre-trained CNN models. Perfect for image retrieval, similarity search, and visual search applications.

## 📁 Files

1. **`extract_features.py`** - Main feature extraction script
2. **`visualize_similarity.py`** - Command-line similarity visualization
3. **`similarity_explorer.ipynb`** - Interactive Jupyter notebook
4. **`FEATURE_EXTRACTION_QUICKSTART.md`** - Quick start guide

---

## 🚀 Quick Start

### Step 1: Extract Features

```bash
python extract_features.py
```

**What it does:**
- Loads ResNet50 pre-trained on ImageNet
- Processes all images in `dataset/` folder
- Extracts 2048-dimensional feature vectors
- L2 normalizes embeddings
- Saves as `.npy` files and CSV

**Time:** ~1-2 seconds per image on GPU, ~5-10 seconds on CPU

### Step 2: Visualize Similarities

```bash
# List all images with indices
python visualize_similarity.py --mode list

# Compare two images
python visualize_similarity.py --mode compare --query-idx 0 --target-idx 1

# Find similar images
python visualize_similarity.py --mode similar --query-idx 0 --top-k 5

# Create similarity matrix
python visualize_similarity.py --mode matrix
```

### Step 3: Interactive Exploration (Optional)

```bash
jupyter notebook similarity_explorer.ipynb
```

---

## 📦 Output Structure

```
embeddings/
├── apple_macbook_pro_14inch/
│   ├── img_01.npy              # Feature vector (2048-D)
│   ├── img_02.npy
│   └── img_03.npy
├── dell_xps_14/
│   └── img_01.npy
├── asus_zenbook_14_oled/
│   ├── img_01.npy
│   └── img_02.npy
├── all_embeddings.csv          # All features in CSV format
└── metadata.txt                # Extraction metadata
```

### CSV Format

```csv
image_path,class_name,feat_0,feat_1,feat_2,...,feat_2047
apple_macbook_pro_14inch/img_01.jpg,apple_macbook_pro_14inch,0.123,-0.456,0.789,...
dell_xps_14/img_01.jpg,dell_xps_14,-0.234,0.567,-0.890,...
```

---

## ✨ Features

### Core Features

✅ **Pre-trained Models**
   - ResNet50 (2048-D) - Default
   - ResNet101 (2048-D) - Deeper network
   - ResNet34 (512-D) - Faster, smaller
   - VGG16 (4096-D) - Alternative architecture

✅ **GPU Acceleration**
   - Automatically uses GPU if available
   - Falls back to CPU gracefully
   - ~5-10x faster on GPU

✅ **L2 Normalization**
   - Unit-length vectors for cosine similarity
   - Better similarity computations
   - Optional (can be disabled)

✅ **Multiple Output Formats**
   - Individual `.npy` files per image
   - Combined CSV file for all images
   - Metadata file with extraction info

✅ **Error Handling**
   - Skips corrupted images
   - Detailed error reporting
   - Progress tracking

### Visualization Features

✅ **Compare Two Images**
   - Side-by-side visualization
   - Cosine similarity score
   - Class labels

✅ **Find Similar Images**
   - Retrieve top-k similar images
   - Ranked by similarity
   - Visual grid display

✅ **Similarity Matrix**
   - Heatmap of all pairwise similarities
   - Filter by class
   - Publication-ready plots

✅ **Interactive Notebook**
   - Jupyter-based exploration
   - t-SNE visualization
   - Statistical analysis
   - Custom queries

---

## 🎯 Use Cases

### 1. Image Retrieval System

```bash
# Extract features
python extract_features.py

# Find similar products
python visualize_similarity.py --mode similar --query-idx 0 --top-k 10
```

**Application:** E-commerce visual search, "find similar products"

### 2. Product Deduplication

```bash
# Extract features
python extract_features.py

# Create similarity matrix
python visualize_similarity.py --mode matrix --class-name "macbook_pro"
```

**Application:** Detect duplicate product listings

### 3. Content-Based Recommendation

```python
# Load embeddings
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

# Find similar items
query_embedding = embeddings[0].reshape(1, -1)
similarities = cosine_similarity(query_embedding, embeddings)[0]
top_5 = np.argsort(similarities)[::-1][1:6]

print("Recommended products:", df.iloc[top_5]['class_name'].values)
```

**Application:** Product recommendations, "customers also viewed"

### 4. Image Clustering

```python
from sklearn.cluster import KMeans

# Cluster products by visual similarity
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(embeddings)

# Assign cluster labels
df['cluster'] = clusters
```

**Application:** Automatic product categorization

---

## 🔧 Command-Line Options

### extract_features.py

```bash
python extract_features.py \
    --dataset-dir dataset \          # Input directory
    --output-dir embeddings \        # Output directory
    --model resnet50 \               # Model choice
    --batch-size 32 \                # Batch size
    --no-gpu \                       # Disable GPU
    --no-normalize                   # Disable L2 normalization
```

**Available Models:**
- `resnet50` - 2048-D, good balance (default)
- `resnet101` - 2048-D, more accurate, slower
- `resnet34` - 512-D, faster, smaller
- `vgg16` - 4096-D, different architecture

### visualize_similarity.py

```bash
# List mode - show all images with indices
python visualize_similarity.py --mode list

# Compare mode - compare two specific images
python visualize_similarity.py \
    --mode compare \
    --query-idx 0 \
    --target-idx 5 \
    --output comparison.png

# Similar mode - find top-k similar images
python visualize_similarity.py \
    --mode similar \
    --query-idx 0 \
    --top-k 5 \
    --output similar_results.png

# Matrix mode - create similarity heatmap
python visualize_similarity.py \
    --mode matrix \
    --class-name "macbook_pro" \
    --output heatmap.png
```

---

## 📊 Understanding Similarity Scores

### Cosine Similarity Range

- **1.0** - Identical images (or same image)
- **0.9-0.99** - Very similar (same product, different angle)
- **0.7-0.89** - Similar (same category, different model)
- **0.5-0.69** - Somewhat similar (related products)
- **0.3-0.49** - Different (different categories)
- **< 0.3** - Very different

### Example Interpretation

```
Query: MacBook Pro 14" (Space Black)

Results:
1. MacBook Pro 14" (Silver)         0.95  ← Same model, different color
2. MacBook Pro 16"                  0.88  ← Same product line, different size
3. MacBook Air 13"                  0.75  ← Same brand, different model
4. Dell XPS 14                      0.62  ← Similar form factor, different brand
5. ASUS ZenBook                     0.58  ← Similar category
```

---

## 🎓 Advanced Usage

### Custom Model Integration

```python
from extract_features import FeatureExtractor

# Initialize extractor
extractor = FeatureExtractor(model_name='resnet50', use_gpu=True)

# Extract features from single image
from PIL import Image
img_path = 'path/to/image.jpg'
img_tensor = extractor.preprocess_image(img_path)
features = extractor.extract_features(img_tensor)

# Normalize
features = extractor.normalize_features(features)

print(f"Feature shape: {features.shape}")  # (2048,)
```

### Batch Processing

```python
import torch
from torchvision import transforms

# Load multiple images
images = [...]  # List of PIL Images

# Preprocess
transform = extractor.transform
image_tensors = torch.stack([transform(img) for img in images])

# Extract features in batch
features = extractor.extract_batch(image_tensors)

print(f"Batch features shape: {features.shape}")  # (N, 2048)
```

### Load Pre-Extracted Features

```python
import numpy as np
import pandas as pd

# Method 1: Load individual .npy file
features = np.load('embeddings/product_name/img_01.npy')

# Method 2: Load all from CSV
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values  # All feature columns
image_paths = df['image_path'].values
class_names = df['class_name'].values
```

### Calculate Similarity

```python
from sklearn.metrics.pairwise import cosine_similarity

# Between two vectors
sim = cosine_similarity(features1.reshape(1, -1),
                       features2.reshape(1, -1))[0][0]

# Pairwise for all
sim_matrix = cosine_similarity(embeddings)
```

---

## 🔬 Model Comparison

| Model | Feature Dim | Speed | Accuracy | Use Case |
|-------|-------------|-------|----------|----------|
| **ResNet50** | 2048 | Medium | High | General purpose ⭐ |
| **ResNet101** | 2048 | Slow | Highest | Maximum accuracy |
| **ResNet34** | 512 | Fast | Good | Speed-critical apps |
| **VGG16** | 4096 | Medium | High | Alternative architecture |

### When to Use Each:

**ResNet50** (Default)
- Best balance of speed and accuracy
- Recommended for most applications
- Well-tested and reliable

**ResNet101**
- Need highest accuracy
- Have powerful GPU
- Accuracy > speed

**ResNet34**
- Real-time applications
- Limited compute resources
- Lower storage requirements (512-D vs 2048-D)

**VGG16**
- Different feature characteristics
- Ensemble with ResNet
- Legacy system compatibility

---

## 💾 Storage Requirements

### Per Image:

- **ResNet50/101:** 2048 × 4 bytes = ~8 KB (float32)
- **ResNet34:** 512 × 4 bytes = ~2 KB
- **VGG16:** 4096 × 4 bytes = ~16 KB

### Dataset Examples:

| Images | ResNet50 | ResNet34 | VGG16 |
|--------|----------|----------|-------|
| 100 | 0.8 MB | 0.2 MB | 1.6 MB |
| 1,000 | 8 MB | 2 MB | 16 MB |
| 10,000 | 80 MB | 20 MB | 160 MB |
| 100,000 | 800 MB | 200 MB | 1.6 GB |

**Note:** CSV format is less efficient than .npy files

---

## ⚡ Performance Tips

### GPU vs CPU

```bash
# Check if GPU is available
python -c "import torch; print(f'GPU: {torch.cuda.is_available()}')"

# Force CPU usage
python extract_features.py --no-gpu

# GPU acceleration (automatic if available)
python extract_features.py
```

**Speed Comparison (per image):**
- GPU (NVIDIA RTX 3080): ~0.5-1 sec
- GPU (NVIDIA GTX 1080): ~1-2 sec
- CPU (Intel i7): ~5-10 sec
- CPU (Intel i5): ~10-20 sec

### Batch Processing

Larger batches = faster processing (up to a point)

```bash
# Small batch (safe for limited memory)
python extract_features.py --batch-size 8

# Medium batch (default)
python extract_features.py --batch-size 32

# Large batch (requires more memory)
python extract_features.py --batch-size 64
```

### Memory Requirements

| Model | Batch Size | GPU Memory | CPU Memory |
|-------|------------|------------|------------|
| ResNet50 | 1 | ~500 MB | ~2 GB |
| ResNet50 | 32 | ~4 GB | ~8 GB |
| ResNet50 | 64 | ~8 GB | ~16 GB |

---

## 🐛 Troubleshooting

### "RuntimeError: CUDA out of memory"

**Solution:** Reduce batch size

```bash
python extract_features.py --batch-size 8
```

### "No module named 'torch'"

**Solution:** Install PyTorch

```bash
pip install torch torchvision
```

### "Cannot find dataset directory"

**Solution:** Ensure dataset exists

```bash
# Check if dataset exists
ls dataset/

# Or preprocess first
python preprocess_advanced.py
```

### Features Look Wrong

**Checklist:**
- [ ] Images preprocessed correctly (224x224, RGB)
- [ ] Using correct model
- [ ] L2 normalization enabled (for cosine similarity)
- [ ] No corrupted images in dataset

### Similarity Scores Too Low

**Causes:**
- Images are actually dissimilar
- Forgot L2 normalization
- Using wrong similarity metric

**Solution:**
```bash
# Ensure normalization is ON
python extract_features.py  # (normalization on by default)

# Use cosine similarity (not euclidean)
from sklearn.metrics.pairwise import cosine_similarity
```

---

## 📚 Integration Examples

### Flask API for Image Search

```python
from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Load embeddings
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

@app.route('/search', methods=['POST'])
def search():
    query_idx = request.json['query_idx']
    top_k = request.json.get('top_k', 5)

    query_emb = embeddings[query_idx].reshape(1, -1)
    sims = cosine_similarity(query_emb, embeddings)[0]

    top_indices = np.argsort(sims)[::-1][1:top_k+1]

    results = []
    for idx in top_indices:
        results.append({
            'image_path': df.iloc[idx]['image_path'],
            'class_name': df.iloc[idx]['class_name'],
            'similarity': float(sims[idx])
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5000)
```

### PyTorch DataLoader Integration

```python
import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np

class EmbeddingDataset(Dataset):
    def __init__(self, embeddings_dir):
        self.embeddings_dir = Path(embeddings_dir)
        self.files = list(self.embeddings_dir.rglob('*.npy'))

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        emb_file = self.files[idx]
        embedding = np.load(emb_file)
        class_name = emb_file.parent.name

        return torch.tensor(embedding), class_name

# Usage
dataset = EmbeddingDataset('embeddings')
loader = DataLoader(dataset, batch_size=32, shuffle=True)

for embeddings, labels in loader:
    # Train your model
    pass
```

---

## 📊 Validation

### Check Feature Quality

```python
import pandas as pd
import numpy as np

# Load features
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

# Check 1: All vectors have unit length (if normalized)
norms = np.linalg.norm(embeddings, axis=1)
print(f"Mean norm: {norms.mean():.4f}")  # Should be ~1.0
print(f"Std norm:  {norms.std():.4f}")   # Should be ~0.0

# Check 2: No NaN or Inf values
print(f"NaN values: {np.isnan(embeddings).sum()}")    # Should be 0
print(f"Inf values: {np.isinf(embeddings).sum()}")    # Should be 0

# Check 3: Feature variance
print(f"Feature variance: {embeddings.var(axis=0).mean():.4f}")

# Check 4: Pairwise similarities are reasonable
from sklearn.metrics.pairwise import cosine_similarity
sim_matrix = cosine_similarity(embeddings)
print(f"Mean similarity: {sim_matrix.mean():.4f}")  # Should be 0.5-0.8
print(f"Std similarity:  {sim_matrix.std():.4f}")
```

---

## 🔗 Requirements

```bash
pip install torch torchvision
pip install numpy pandas
pip install scikit-learn
pip install matplotlib seaborn
pip install Pillow
pip install jupyter  # For notebook
```

Or install all at once:
```bash
pip install torch torchvision numpy pandas scikit-learn matplotlib seaborn Pillow jupyter
```

---

## 📖 Further Reading

- [ResNet Paper](https://arxiv.org/abs/1512.03385)
- [Image Retrieval Tutorial](https://pytorch.org/tutorials/beginner/basics/data_tutorial.html)
- [Cosine Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- [t-SNE Visualization](https://scikit-learn.org/stable/modules/manifold.html#t-sne)

---

## ✅ Checklist

Before using features for your application:

- [ ] Extracted features for all images
- [ ] Validated feature dimensions (2048 for ResNet50)
- [ ] Checked L2 normalization (norms ≈ 1.0)
- [ ] Tested similarity computations
- [ ] Visualized t-SNE to check separability
- [ ] Verified intra-class > inter-class similarity
- [ ] Saved embeddings in appropriate format
- [ ] Documented model and preprocessing used

---

**Ready to Extract Features!** 🚀

Start with `python extract_features.py` and explore with the Jupyter notebook!
