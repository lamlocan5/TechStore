# Image Preprocessing for Machine Learning

Python scripts for preprocessing product image datasets for ML model training. Includes resizing, format conversion, normalization, and validation.

## 📁 Files

1. **`preprocess_dataset.py`** - Basic preprocessing (overwrites originals)
2. **`preprocess_advanced.py`** - Advanced preprocessing (saves to new directory)
3. **`test_preprocessing.py`** - Test utility for small subsets
4. **`inspect_dataset.py`** - Dataset validation and analysis tool

---

## 🚀 Quick Start

### Test First (Recommended)

Before processing your full dataset, test on a small subset:

```bash
python test_preprocessing.py
```

This will:
- Create a test subset with 2 images per product
- Let you preview preprocessing results
- Avoid accidental data loss

### Basic Preprocessing (In-Place)

**⚠️ WARNING: This overwrites original images!**

```bash
# Basic usage - resize to 224x224, overwrite originals
python preprocess_dataset.py

# Custom size
python preprocess_dataset.py --size 256

# Different resize modes
python preprocess_dataset.py --mode crop     # Center crop (default)
python preprocess_dataset.py --mode resize   # Simple resize (may distort)
python preprocess_dataset.py --mode pad      # Pad with black borders

# With backups
python preprocess_dataset.py --backup

# Validate only (no processing)
python preprocess_dataset.py --validate-only
```

### Advanced Preprocessing (Saves to New Directory)

**✅ Safe: Original images are preserved**

```bash
# Basic usage - saves to dataset_processed/
python preprocess_advanced.py

# Custom input/output directories
python preprocess_advanced.py --input-dir dataset --output-dir my_processed_dataset

# With enhancements
python preprocess_advanced.py --enhance-contrast --enhance-sharpness

# Different output format
python preprocess_advanced.py --format PNG

# Custom JPEG quality
python preprocess_advanced.py --quality 90

# Complete example
python preprocess_advanced.py \
    --input-dir dataset \
    --output-dir dataset_224_crop \
    --size 224 \
    --mode crop \
    --enhance-contrast \
    --format JPEG \
    --quality 95
```

---

## 📋 Features

### Preprocessing Operations

#### 1. **Format Conversion**
- Converts all images to RGB format
- Handles RGBA, grayscale, palette modes
- Ensures consistent 3-channel output

#### 2. **Resizing Modes**

**Resize** (Simple)
- Stretches image to target size
- May distort aspect ratio
- Fastest option
- Good for: Pre-trained models requiring exact size

**Crop** (Center Crop)
- Maintains aspect ratio
- Crops from center
- No distortion
- Good for: Product images, general purpose

**Pad** (Letterbox)
- Maintains aspect ratio
- Adds black borders
- Preserves all content
- Good for: Objects that must stay complete

#### 3. **Auto-Orientation**
- Reads EXIF orientation data
- Automatically rotates images correctly
- Fixes smartphone photos

#### 4. **Image Enhancement** (Advanced only)
- Contrast enhancement
- Sharpness adjustment
- Configurable intensity

#### 5. **Quality Control**
- Handles corrupted images gracefully
- Skips broken files
- Detailed error reporting

---

## 🎯 Use Cases

### For PyTorch/TensorFlow Training

```bash
# Standard ImageNet preprocessing
python preprocess_advanced.py \
    --size 224 \
    --mode crop \
    --format JPEG \
    --quality 95
```

Then in your training code:
```python
from torchvision import transforms

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                       std=[0.229, 0.224, 0.225])
])
```

### For Transfer Learning

```bash
# Match your pre-trained model's input size
python preprocess_advanced.py --size 299  # For Inception
python preprocess_advanced.py --size 384  # For ViT-L
python preprocess_advanced.py --size 512  # For larger models
```

### For Object Detection

```bash
# Pad mode to preserve full object
python preprocess_advanced.py \
    --size 416 \
    --mode pad \
    --format JPEG
```

### For Image Retrieval

```bash
# High quality, crop mode
python preprocess_advanced.py \
    --size 224 \
    --mode crop \
    --enhance-contrast \
    --enhance-sharpness \
    --quality 98
```

---

## 📊 Output Structure

### Basic Preprocessing
```
dataset/                    # Modified in-place
├── product_1/
│   ├── img_01.jpg         # Resized to 224x224 RGB
│   ├── img_02.jpg
│   └── img_01_backup.jpg  # Only if --backup used
└── product_2/
    └── img_01.jpg
```

### Advanced Preprocessing
```
dataset/                    # Original preserved
└── ...

dataset_processed/          # New processed dataset
├── product_1/
│   ├── img_01.jpg         # Processed
│   └── img_02.jpg
├── product_2/
│   └── img_01.jpg
└── preprocessing_metadata.json  # Processing details
```

### Metadata File Structure
```json
{
  "preprocessing": {
    "target_size": [224, 224],
    "resize_mode": "crop",
    "auto_orient": true,
    "enhance_contrast": false,
    "enhance_sharpness": false,
    "save_format": "JPEG"
  },
  "products": {
    "product_name": {
      "total_images": 4,
      "images": [
        {
          "original_name": "img_01.png",
          "processed_name": "img_01.jpg",
          "original_size": [1920, 1080],
          "processed_size": [224, 224]
        }
      ]
    }
  }
}
```

---

## 🔧 Command-Line Options

### preprocess_dataset.py

| Option | Default | Description |
|--------|---------|-------------|
| `--dataset-dir` | `dataset` | Dataset directory path |
| `--size` | `224` | Target image size |
| `--mode` | `resize` | Resize mode (resize/crop/pad) |
| `--backup` | `False` | Create backups before overwriting |
| `--validate-only` | `False` | Only validate, don't process |

### preprocess_advanced.py

| Option | Default | Description |
|--------|---------|-------------|
| `--input-dir` | `dataset` | Input dataset directory |
| `--output-dir` | `dataset_processed` | Output directory |
| `--size` | `224` | Target image size |
| `--mode` | `crop` | Resize mode (resize/crop/pad) |
| `--enhance-contrast` | `False` | Auto-enhance contrast |
| `--enhance-sharpness` | `False` | Enhance sharpness |
| `--format` | `JPEG` | Output format (JPEG/PNG) |
| `--quality` | `95` | JPEG quality (1-100) |

---

## 📈 Example Workflow

### Complete ML Pipeline

```bash
# 1. Download dataset
python download_laptop_dataset.py

# 2. Inspect original dataset
python inspect_dataset.py

# 3. Test preprocessing on subset
python test_preprocessing.py

# 4. Preprocess full dataset
python preprocess_advanced.py \
    --input-dir dataset \
    --output-dir dataset_224 \
    --size 224 \
    --mode crop \
    --enhance-contrast

# 5. Validate processed dataset
python inspect_dataset.py --dataset-dir dataset_224

# 6. Ready for training!
```

---

## 🎓 Resize Mode Comparison

| Mode | Pros | Cons | Best For |
|------|------|------|----------|
| **resize** | Fast, simple | May distort | Fixed input size required |
| **crop** | No distortion, preserves quality | Loses some content | Product photos, portraits |
| **pad** | Preserves all content | Black borders, lower effective resolution | Object detection, small objects |

### Visual Examples

**Original: 1920x1080 → Target: 224x224**

```
Resize Mode:
┌──────────────┐     ┌─────┐
│              │ --> │     │  (stretched)
│   Original   │     │ 224 │
│              │     │     │
└──────────────┘     └─────┘

Crop Mode:
┌──────────────┐     ┌─────┐
│   ████████   │ --> │     │  (center portion)
│   ▓Original▓ │     │ 224 │
│   ████████   │     │     │
└──────────────┘     └─────┘

Pad Mode:
┌──────────────┐     ┌─────┐
│              │     │ ▓▓▓ │  (with black bars)
│   Original   │ --> │▓Img▓│
│              │     │ ▓▓▓ │
└──────────────┘     └─────┘
```

---

## 🛠️ Troubleshooting

### Issue: "OSError: image file is truncated"

**Solution:**
```python
from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
```

Add to top of preprocessing script if you have partially downloaded images.

### Issue: Images look distorted

**Solution:** Use `--mode crop` instead of `--mode resize`

### Issue: Important parts of image are cut off

**Solution:** Use `--mode pad` to preserve full content

### Issue: Images too large (file size)

**Solution:** Reduce JPEG quality:
```bash
python preprocess_advanced.py --quality 85
```

### Issue: Need different sizes for different models

**Solution:** Run preprocessing multiple times:
```bash
python preprocess_advanced.py --size 224 --output-dir dataset_224
python preprocess_advanced.py --size 384 --output-dir dataset_384
```

---

## 📊 Performance Tips

### Processing Speed

- **JPEG is faster** than PNG (both save and load)
- **resize mode is fastest**, pad is slowest
- Disable enhancements if not needed
- Process on SSD for better I/O

### File Size

- Use JPEG for photos, PNG for graphics/diagrams
- Quality 90-95 is usually indistinguishable from 100
- Consider quality vs size tradeoff:
  - Quality 95: ~200KB per 224x224 image
  - Quality 85: ~100KB per 224x224 image
  - Quality 70: ~60KB per 224x224 image

### Memory Usage

Scripts process one image at a time (low memory footprint). Safe for:
- Datasets with 10,000+ images
- High-resolution source images (4K+)
- Systems with 4GB+ RAM

---

## 🔍 Validation

After preprocessing, always validate:

```bash
# Check processed dataset
python inspect_dataset.py

# Validate specific requirements
python preprocess_dataset.py --dataset-dir dataset_224 --validate-only
```

**What to check:**
- ✓ All images are 224x224 (or your target size)
- ✓ All images are RGB mode
- ✓ No corrupted files
- ✓ Reasonable file sizes
- ✓ Expected number of images

---

## 💾 Backup Strategy

### Option 1: Use --backup flag
```bash
python preprocess_dataset.py --backup
```
Creates `img_01_backup.jpg` alongside each image.

### Option 2: Use advanced script (recommended)
```bash
python preprocess_advanced.py --output-dir dataset_processed
```
Keeps original `dataset/` untouched.

### Option 3: Manual backup
```bash
cp -r dataset dataset_original
python preprocess_dataset.py
```

---

## 📚 Integration with ML Frameworks

### PyTorch DataLoader

```python
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

dataset = datasets.ImageFolder('dataset_224', transform=transform)
loader = DataLoader(dataset, batch_size=32, shuffle=True)
```

### TensorFlow Dataset

```python
import tensorflow as tf

dataset = tf.keras.preprocessing.image_dataset_from_directory(
    'dataset_224',
    image_size=(224, 224),
    batch_size=32
)

# Normalize
normalization_layer = tf.keras.layers.Rescaling(1./255)
dataset = dataset.map(lambda x, y: (normalization_layer(x), y))
```

---

## 🎯 Best Practices

1. **Always test first** - Use `test_preprocessing.py` on subset
2. **Keep originals** - Use advanced script or backup
3. **Validate after** - Check results with `inspect_dataset.py`
4. **Match model requirements** - Use correct size for your architecture
5. **Document settings** - Keep preprocessing parameters for reproducibility
6. **Quality over quantity** - Better to have fewer high-quality images

---

## 📄 Requirements

```bash
pip install Pillow
```

That's it! Only PIL/Pillow is required. All other imports are standard library.

---

## ✅ Checklist

Before training your model:

- [ ] Downloaded dataset
- [ ] Tested preprocessing on subset
- [ ] Chose appropriate resize mode
- [ ] Preprocessed full dataset
- [ ] Validated processed images
- [ ] Backed up originals
- [ ] Checked file sizes are reasonable
- [ ] Verified all images load correctly
- [ ] Documented preprocessing parameters

---

**Ready to Preprocess!** 🚀

Start with `python test_preprocessing.py` for a safe first run.
