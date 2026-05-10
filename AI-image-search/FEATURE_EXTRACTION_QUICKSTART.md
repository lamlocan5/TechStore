# Feature Extraction - Quick Start Guide

**Extract deep learning features from images in 3 steps**

---

## ⚡ 3-Step Quick Start

### Step 1: Extract Features (2 minutes)

```bash
python extract_features.py
```

**What happens:**
- Loads ResNet50 pre-trained on ImageNet
- Processes all images in `dataset/` folder
- Extracts 2048-dimensional feature vectors
- L2 normalizes for cosine similarity
- Saves as `.npy` files and CSV

**Output:**
```
embeddings/
├── product1/
│   ├── img_01.npy
│   └── img_02.npy
├── product2/
│   └── img_01.npy
├── all_embeddings.csv       ← All features in one file
└── metadata.txt
```

---

### Step 2: Find Similar Images

```bash
# List all images with indices
python visualize_similarity.py --mode list

# Find similar images to image 0
python visualize_similarity.py --mode similar --query-idx 0 --top-k 5
```

**Result:** Shows the 5 most similar images with similarity scores

---

### Step 3: Interactive Exploration (Optional)

```bash
jupyter notebook similarity_explorer.ipynb
```

**Features:**
- Compare any two images
- Find similar images interactively
- t-SNE visualization
- Similarity heatmaps
- Statistical analysis

---

## 🎯 Common Commands

### Basic Feature Extraction

```bash
# Default (ResNet50, GPU if available, with normalization)
python extract_features.py

# Use CPU only
python extract_features.py --no-gpu

# Use different model
python extract_features.py --model resnet101
python extract_features.py --model resnet34    # Faster
```

### Similarity Visualization

```bash
# Compare two specific images
python visualize_similarity.py --mode compare --query-idx 0 --target-idx 5

# Find top 10 similar images
python visualize_similarity.py --mode similar --query-idx 0 --top-k 10

# Create similarity matrix heatmap
python visualize_similarity.py --mode matrix

# Save visualization to file
python visualize_similarity.py --mode similar --query-idx 0 --output result.png
```

---

## 📊 What Gets Created

### Individual Feature Files (`.npy`)

```python
import numpy as np

# Load features for one image
features = np.load('embeddings/macbook_pro/img_01.npy')
print(features.shape)  # (2048,)
```

### Combined CSV File

```python
import pandas as pd

# Load all features
df = pd.read_csv('embeddings/all_embeddings.csv')

# Columns: image_path, class_name, feat_0, feat_1, ..., feat_2047
print(df.head())
```

### Format:
```csv
image_path,class_name,feat_0,feat_1,...,feat_2047
macbook_pro/img_01.jpg,macbook_pro,0.123,-0.456,...
dell_xps/img_01.jpg,dell_xps,-0.234,0.567,...
```

---

## 🔍 Understanding Results

### Similarity Scores (Cosine Similarity)

| Score | Meaning | Example |
|-------|---------|---------|
| **0.95-1.0** | Nearly identical | Same product, different lighting |
| **0.85-0.94** | Very similar | Same model, different color/angle |
| **0.70-0.84** | Similar | Same category, different model |
| **0.50-0.69** | Somewhat similar | Related products |
| **< 0.50** | Different | Unrelated products |

### Example Output

```
Query: MacBook Pro 14" (Space Black)

Top 5 Similar Images:
1. MacBook Pro 14" (Silver)      Similarity: 0.96  ✓ Same model
2. MacBook Pro 16"               Similarity: 0.89  ✓ Same line
3. MacBook Air 13"               Similarity: 0.76  ✓ Same brand
4. Dell XPS 14                   Similarity: 0.63  ✓ Similar category
5. ASUS ZenBook                  Similarity: 0.59  ✓ Laptop
```

---

## 🎓 Use Cases

### 1. Visual Search (E-commerce)

```bash
# Extract features once
python extract_features.py

# Query: Find similar products
python visualize_similarity.py --mode similar --query-idx 0 --top-k 10
```

**Application:** "Find similar products" feature

### 2. Duplicate Detection

```bash
# Create similarity matrix
python visualize_similarity.py --mode matrix

# Look for high similarities (>0.95) between different images
```

**Application:** Detect duplicate product listings

### 3. Product Recommendations

```python
# Load features
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

# Find similar to product 0
query = embeddings[0].reshape(1, -1)
sims = cosine_similarity(query, embeddings)[0]
top_5 = np.argsort(sims)[::-1][1:6]

print("Recommended:", df.iloc[top_5]['class_name'].values)
```

**Application:** "Customers also viewed" recommendations

---

## 🚀 Quick Workflow

### Complete Pipeline (5 minutes)

```bash
# 1. Preprocess images (if not done)
python preprocess_advanced.py --size 224 --mode crop

# 2. Extract features
python extract_features.py

# 3. List available images
python visualize_similarity.py --mode list

# 4. Find similar images
python visualize_similarity.py --mode similar --query-idx 0

# 5. Explore interactively
jupyter notebook similarity_explorer.ipynb
```

---

## 📋 Options Cheat Sheet

### extract_features.py

```bash
--dataset-dir DIR          # Input directory (default: dataset)
--output-dir DIR           # Output directory (default: embeddings)
--model MODEL              # resnet50, resnet101, resnet34, vgg16
--batch-size N             # Batch size (default: 32)
--no-gpu                   # Force CPU usage
--no-normalize             # Disable L2 normalization
```

### visualize_similarity.py

```bash
--mode MODE                # list, compare, similar, matrix
--query-idx N              # Query image index
--target-idx N             # Target image index (compare mode)
--top-k N                  # Number of results (default: 5)
--class-name NAME          # Filter by class (matrix mode)
--output FILE              # Save visualization to file
```

---

## 💡 Pro Tips

1. **Always use GPU** - 5-10x faster than CPU
   ```bash
   # Check GPU availability
   python -c "import torch; print(f'GPU: {torch.cuda.is_available()}')"
   ```

2. **Keep normalization ON** - Required for cosine similarity
   ```bash
   # Default (normalized)
   python extract_features.py
   ```

3. **Use ResNet50** - Best balance of speed and accuracy
   ```bash
   # Default model
   python extract_features.py --model resnet50
   ```

4. **Save visualizations** - For presentations/reports
   ```bash
   python visualize_similarity.py --mode similar --query-idx 0 --output fig.png
   ```

5. **Explore with notebook** - Most flexible for analysis
   ```bash
   jupyter notebook similarity_explorer.ipynb
   ```

---

## 🔧 Troubleshooting

### Issue: "CUDA out of memory"
**Fix:** Reduce batch size
```bash
python extract_features.py --batch-size 8
```

### Issue: "No module named 'torch'"
**Fix:** Install PyTorch
```bash
pip install torch torchvision
```

### Issue: Low similarity scores
**Fix:** Ensure normalization is enabled (it's on by default)

### Issue: Slow processing
**Fix:** Use GPU or smaller model
```bash
python extract_features.py --model resnet34  # Faster
```

---

## 📦 Requirements

```bash
pip install torch torchvision numpy pandas scikit-learn matplotlib Pillow jupyter
```

Or install individually:
```bash
pip install torch torchvision    # Deep learning
pip install numpy pandas          # Data handling
pip install scikit-learn          # Similarity computation
pip install matplotlib seaborn    # Visualization
pip install Pillow                # Image loading
pip install jupyter               # Notebook (optional)
```

---

## ⚡ Performance

| Hardware | Time per Image |
|----------|----------------|
| NVIDIA RTX 3080 | 0.5-1 sec |
| NVIDIA GTX 1080 | 1-2 sec |
| Intel i7 CPU | 5-10 sec |
| Intel i5 CPU | 10-20 sec |

**For 16 images (laptop dataset):**
- GPU: ~10-20 seconds
- CPU: ~2-3 minutes

---

## 📊 Feature Dimensions

| Model | Dimension | Speed | Use Case |
|-------|-----------|-------|----------|
| **ResNet50** | 2048 | Medium | General purpose ⭐ |
| **ResNet101** | 2048 | Slow | Highest accuracy |
| **ResNet34** | 512 | Fast | Speed critical |
| **VGG16** | 4096 | Medium | Alternative |

**Recommendation:** Start with ResNet50

---

## 🎯 Next Steps

After feature extraction:

1. **Validate features:**
   ```bash
   python visualize_similarity.py --mode matrix
   ```

2. **Test similarity search:**
   ```bash
   python visualize_similarity.py --mode similar --query-idx 0
   ```

3. **Explore interactively:**
   ```bash
   jupyter notebook similarity_explorer.ipynb
   ```

4. **Build your application:**
   - Visual search API
   - Recommendation system
   - Duplicate detection
   - Image clustering

---

## 📚 Examples

### Python Script: Find Similar

```python
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load embeddings
df = pd.read_csv('embeddings/all_embeddings.csv')
embeddings = df.iloc[:, 2:].values

# Query
query_idx = 0
query_emb = embeddings[query_idx].reshape(1, -1)

# Calculate similarities
sims = cosine_similarity(query_emb, embeddings)[0]

# Top 5
top_5_idx = np.argsort(sims)[::-1][1:6]

for i, idx in enumerate(top_5_idx):
    print(f"{i+1}. {df.iloc[idx]['class_name']}: {sims[idx]:.4f}")
```

### Python Script: Compare Two

```python
# Compare images 0 and 5
idx1, idx2 = 0, 5

emb1 = embeddings[idx1].reshape(1, -1)
emb2 = embeddings[idx2].reshape(1, -1)

sim = cosine_similarity(emb1, emb2)[0][0]

print(f"Image 1: {df.iloc[idx1]['class_name']}")
print(f"Image 2: {df.iloc[idx2]['class_name']}")
print(f"Similarity: {sim:.4f}")
```

---

## ✅ Quick Checklist

- [ ] Installed PyTorch and dependencies
- [ ] Preprocessed images to 224x224 RGB
- [ ] Extracted features using `extract_features.py`
- [ ] Checked GPU is being used (if available)
- [ ] Validated embeddings are normalized
- [ ] Tested similarity search
- [ ] Explored with visualization tools

---

**Ready to Extract!** 🚀

Start with: `python extract_features.py`

Then explore with: `python visualize_similarity.py --mode list`

---

For full documentation, see `README_FEATURE_EXTRACTION.md`
