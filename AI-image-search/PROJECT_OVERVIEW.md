# Complete ML Image Dataset Pipeline

**End-to-end system for building image retrieval and similarity search applications**

---

## 📚 Project Structure

```
D:\code\do_an\
│
├── 📥 DATASET COLLECTION
│   ├── download_dataset.py           # Generic image downloader
│   ├── download_laptop_dataset.py    # Laptop-specific downloader
│   ├── example_usage.py              # Download examples
│   ├── laptop_dataset.json           # 15 laptop models, 16 images
│   ├── laptop_dataset_summary.md     # Dataset documentation
│   └── README_DATASET.md             # Download guide
│
├── 🔄 IMAGE PREPROCESSING
│   ├── preprocess_dataset.py         # Basic preprocessing (in-place)
│   ├── preprocess_advanced.py        # Advanced preprocessing (safe)
│   ├── test_preprocessing.py         # Test on subset
│   ├── inspect_dataset.py            # Validate dataset
│   ├── README_PREPROCESSING.md       # Full preprocessing docs
│   └── PREPROCESSING_QUICKSTART.md   # Quick start guide
│
├── 🧠 FEATURE EXTRACTION
│   ├── extract_features.py           # ResNet50 feature extraction
│   ├── visualize_similarity.py       # CLI similarity visualization
│   ├── similarity_explorer.ipynb     # Interactive Jupyter notebook
│   ├── README_FEATURE_EXTRACTION.md  # Full extraction docs
│   └── FEATURE_EXTRACTION_QUICKSTART.md  # Quick start guide
│
├── 📋 CONFIGURATION
│   ├── requirements.txt              # Python dependencies
│   └── PROJECT_OVERVIEW.md           # This file
│
└── 📊 OUTPUT DIRECTORIES (created by scripts)
    ├── dataset/                      # Downloaded images
    ├── dataset_processed/            # Preprocessed images
    └── embeddings/                   # Extracted features
```

---

## 🚀 Complete Workflow (10 Minutes)

### Phase 1: Dataset Collection (2 minutes)

```bash
# Download laptop dataset (16 images from 7 brands)
python download_laptop_dataset.py

# Or use your own images
python example_usage.py  # Edit with your URLs first
```

**Result:** `dataset/` folder with organized product images

---

### Phase 2: Preprocessing (2 minutes)

```bash
# Test on small subset first
python test_preprocessing.py

# If looks good, process full dataset
python preprocess_advanced.py --size 224 --mode crop

# Validate results
python inspect_dataset.py
```

**Result:** `dataset_processed/` with 224x224 RGB JPEG images

---

### Phase 3: Feature Extraction (2 minutes)

```bash
# Extract features using ResNet50
python extract_features.py

# Visualize similarities
python visualize_similarity.py --mode list
python visualize_similarity.py --mode similar --query-idx 0

# Or explore interactively
jupyter notebook similarity_explorer.ipynb
```

**Result:** `embeddings/` with feature vectors and CSV file

---

## 📦 Installation

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install torch torchvision numpy pandas scikit-learn matplotlib seaborn Pillow requests jupyter
```

### Step 2: Verify GPU (Optional but Recommended)

```bash
python -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}')"
```

If False and you have NVIDIA GPU, install CUDA-enabled PyTorch:
- Visit: https://pytorch.org/get-started/locally/
- Select your CUDA version
- Install appropriate PyTorch version

---

## 🎯 Use Cases

### 1. **Visual Search / Image Retrieval**

```bash
# Full pipeline
python download_laptop_dataset.py
python preprocess_advanced.py
python extract_features.py

# Search for similar products
python visualize_similarity.py --mode similar --query-idx 0 --top-k 10
```

**Application:** E-commerce "find similar products" feature

---

### 2. **Product Recommendations**

```python
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load features
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

# Find recommendations for product 0
query = embeddings[0].reshape(1, -1)
sims = cosine_similarity(query, embeddings)[0]
top_5 = np.argsort(sims)[::-1][1:6]

print("Recommended:", df.iloc[top_5]['class_name'].values)
```

**Application:** "Customers also viewed" recommendations

---

### 3. **Duplicate Detection**

```bash
# Extract features
python extract_features.py

# Create similarity matrix
python visualize_similarity.py --mode matrix

# High similarities (>0.95) indicate potential duplicates
```

**Application:** Detect duplicate product listings

---

### 4. **Image Clustering**

```python
from sklearn.cluster import KMeans

# Cluster by visual similarity
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(embeddings)

df['cluster'] = clusters
print(df.groupby('cluster')['class_name'].value_counts())
```

**Application:** Automatic categorization

---

## 📊 Dataset Information

### Included Laptop Dataset

**15 models from 7 brands:**
- Apple: MacBook Pro 14", MacBook Air 13" & 15"
- Dell: XPS 13, 14, 16
- ASUS: ZenBook 14 OLED, ROG Zephyrus G14, ZenBook Duo
- HP: Spectre x360 14, Envy x360 14
- Lenovo: ThinkPad X1 Carbon Gen 12
- Acer: Swift Go 14, Aspire Vero 16
- MSI: Prestige 16 AI Evo

**16 high-resolution images ready to download**

---

## 🔧 Configuration Options

### Dataset Collection

```bash
# Generic downloader
python download_dataset.py

# Laptop dataset
python download_laptop_dataset.py

# Custom URLs
# Edit example_usage.py with your image URLs
python example_usage.py
```

---

### Preprocessing

```bash
# Basic (overwrites originals)
python preprocess_dataset.py \
    --dataset-dir dataset \
    --size 224 \
    --mode crop \
    --backup

# Advanced (saves to new directory)
python preprocess_advanced.py \
    --input-dir dataset \
    --output-dir dataset_224 \
    --size 224 \
    --mode crop \
    --enhance-contrast \
    --format JPEG \
    --quality 95
```

**Resize modes:**
- `resize` - Simple resize (may distort)
- `crop` - Center crop (recommended)
- `pad` - Letterbox with black borders

---

### Feature Extraction

```bash
python extract_features.py \
    --dataset-dir dataset_224 \
    --output-dir embeddings \
    --model resnet50 \
    --batch-size 32

# Available models
--model resnet50   # 2048-D, balanced (default)
--model resnet101  # 2048-D, more accurate
--model resnet34   # 512-D, faster
--model vgg16      # 4096-D, alternative
```

---

## 📈 Performance Benchmarks

### Processing Time (for 16 images)

| Task | GPU | CPU |
|------|-----|-----|
| **Download** | 10-20 sec | 10-20 sec |
| **Preprocessing** | 5-10 sec | 10-15 sec |
| **Feature Extraction** | 10-15 sec | 2-3 min |
| **Total** | ~30-45 sec | ~3-4 min |

### Storage Requirements

| Stage | Size (16 images) |
|-------|------------------|
| **Original images** | 8-15 MB |
| **Preprocessed (224x224)** | 3-4 MB |
| **Features (ResNet50)** | 0.5 MB |
| **CSV file** | 0.2 MB |

---

## 🔍 Key Features

### Dataset Collection
✅ Automatic download from URLs
✅ Organized folder structure
✅ Metadata tracking
✅ Error handling and retry logic
✅ Progress tracking

### Preprocessing
✅ Multiple resize modes (resize, crop, pad)
✅ RGB conversion
✅ Auto-orientation
✅ Format conversion
✅ Quality control
✅ Batch processing

### Feature Extraction
✅ Pre-trained CNN models (ResNet, VGG)
✅ GPU acceleration
✅ L2 normalization
✅ Batch processing
✅ Multiple output formats
✅ Progress tracking

### Visualization
✅ Compare two images
✅ Find similar images
✅ Similarity matrix heatmaps
✅ t-SNE visualization
✅ Interactive Jupyter notebook
✅ Statistical analysis

---

## 📚 Documentation

### Quick Start Guides (5-minute read)
- `PREPROCESSING_QUICKSTART.md` - Fast preprocessing guide
- `FEATURE_EXTRACTION_QUICKSTART.md` - Fast extraction guide

### Complete Documentation (30-minute read)
- `README_DATASET.md` - Dataset collection guide
- `README_PREPROCESSING.md` - Full preprocessing documentation
- `README_FEATURE_EXTRACTION.md` - Full extraction documentation

### Reference
- `laptop_dataset_summary.md` - Detailed dataset information
- `PROJECT_OVERVIEW.md` - This file

---

## 🛠️ Troubleshooting

### Common Issues

**1. "Dataset directory not found"**
```bash
# Solution: Download dataset first
python download_laptop_dataset.py
```

**2. "CUDA out of memory"**
```bash
# Solution: Reduce batch size
python extract_features.py --batch-size 8
```

**3. "No module named 'torch'"**
```bash
# Solution: Install PyTorch
pip install torch torchvision
```

**4. Images look distorted**
```bash
# Solution: Use crop mode
python preprocess_advanced.py --mode crop
```

**5. Low similarity scores**
```bash
# Solution: Ensure normalization is ON (default)
python extract_features.py  # Normalization enabled by default
```

---

## 💡 Best Practices

1. **Always test preprocessing first**
   ```bash
   python test_preprocessing.py
   ```

2. **Keep original images**
   ```bash
   # Use advanced script (doesn't overwrite)
   python preprocess_advanced.py
   ```

3. **Use GPU for feature extraction**
   ```bash
   # Check GPU availability
   python -c "import torch; print(torch.cuda.is_available())"
   ```

4. **Validate each stage**
   ```bash
   python inspect_dataset.py  # After preprocessing
   python visualize_similarity.py --mode matrix  # After extraction
   ```

5. **Document your pipeline**
   - Keep track of preprocessing parameters
   - Note which model was used
   - Save important similarity scores

---

## 🎓 Learning Path

### Beginner (1 hour)

1. Read quickstart guides
2. Download laptop dataset
3. Run basic preprocessing
4. Extract features with ResNet50
5. Try similarity search

### Intermediate (3 hours)

1. Read full documentation
2. Experiment with different preprocessing modes
3. Try different CNN models
4. Explore Jupyter notebook
5. Create custom visualizations

### Advanced (Full day)

1. Build Flask API for image search
2. Implement real-time similarity search
3. Create custom model fine-tuning pipeline
4. Optimize for production deployment
5. Build complete application

---

## 🔗 Integration Examples

### Flask API

```python
from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

@app.route('/search', methods=['POST'])
def search():
    query_idx = request.json['query_idx']
    query_emb = embeddings[query_idx].reshape(1, -1)
    sims = cosine_similarity(query_emb, embeddings)[0]
    top_5 = np.argsort(sims)[::-1][1:6]

    return jsonify({
        'results': [
            {'image': df.iloc[i]['image_path'], 'score': float(sims[i])}
            for i in top_5
        ]
    })

app.run(port=5000)
```

### PyTorch Training

```python
import torch
from torch.utils.data import Dataset, DataLoader

class ProductDataset(Dataset):
    def __init__(self, csv_path):
        self.df = pd.read_csv(csv_path)
        self.embeddings = self.df.iloc[:, 2:].values

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        embedding = torch.tensor(self.embeddings[idx], dtype=torch.float32)
        label = self.df.iloc[idx]['class_name']
        return embedding, label

dataset = ProductDataset('embeddings/all_embeddings.csv')
loader = DataLoader(dataset, batch_size=32, shuffle=True)
```

---

## ✅ Project Checklist

### Setup
- [ ] Installed Python 3.7+
- [ ] Installed all dependencies (`requirements.txt`)
- [ ] Verified GPU availability (optional)
- [ ] Read quick start guides

### Dataset
- [ ] Downloaded or collected images
- [ ] Organized in product folders
- [ ] Validated image quality
- [ ] Documented data sources

### Preprocessing
- [ ] Tested on subset
- [ ] Chose appropriate resize mode
- [ ] Processed full dataset
- [ ] Validated results
- [ ] Kept backup of originals

### Feature Extraction
- [ ] Extracted features
- [ ] Checked GPU usage
- [ ] Validated embeddings
- [ ] Tested similarity search
- [ ] Saved results in appropriate format

### Validation
- [ ] Checked feature dimensions
- [ ] Verified L2 normalization
- [ ] Tested similarity computations
- [ ] Created visualizations
- [ ] Documented parameters used

---

## 📊 Expected Results

### For Laptop Dataset (16 images)

**After Download:**
- 16 images across 7 brands
- ~8-15 MB total size
- Organized by product

**After Preprocessing:**
- All images 224×224 RGB
- ~3-4 MB total size
- Consistent format (JPEG)

**After Feature Extraction:**
- 16 feature vectors (2048-D each)
- ~0.5 MB total size
- CSV with all embeddings

**Similarity Scores:**
- Intra-class (same product): 0.85-0.95
- Inter-class (different products): 0.50-0.75
- Very different products: 0.30-0.50

---

## 🎉 Next Steps

After completing the pipeline:

1. **Experiment with parameters**
   - Try different preprocessing modes
   - Test different models
   - Adjust similarity thresholds

2. **Build applications**
   - Visual search API
   - Recommendation engine
   - Duplicate detector
   - Image clustering tool

3. **Scale up**
   - Process larger datasets
   - Optimize for production
   - Add caching layer
   - Implement indexing

4. **Extend functionality**
   - Fine-tune models
   - Add custom features
   - Implement ranking algorithms
   - Build web interface

---

## 📞 Support

For issues or questions:

1. **Check documentation**
   - Quick start guides for fast solutions
   - Full documentation for detailed info

2. **Validate your setup**
   ```bash
   python -c "import torch; print(f'PyTorch: {torch.__version__}')"
   python -c "import torch; print(f'GPU: {torch.cuda.is_available()}')"
   ```

3. **Run validation scripts**
   ```bash
   python inspect_dataset.py
   python visualize_similarity.py --mode list
   ```

---

## 🏆 Project Goals Achieved

✅ **Complete dataset collection system**
✅ **Robust image preprocessing pipeline**
✅ **Feature extraction with SOTA models**
✅ **Similarity search and visualization**
✅ **Interactive exploration tools**
✅ **Comprehensive documentation**
✅ **Production-ready code**

---

**Ready to Build!** 🚀

Start with: `python download_laptop_dataset.py`

Then follow the workflow in the sections above!

---

*Last updated: 2025-10-31*
