# Image Preprocessing - Quick Start Guide

**Fast track to preprocessed ML-ready images in 3 steps**

---

## ⚡ 3-Step Quick Start

### Step 1: Test on Small Subset (1 minute)

```bash
python test_preprocessing.py
```

**What it does:**
- Creates test folder with 2 images per product
- Shows before/after comparison
- Safe - won't touch your main dataset

**Choose option 2** (Advanced preprocessing) when prompted - it's safer!

---

### Step 2: Review Test Results

Check the output:
- ✅ Are images the right size?
- ✅ Do they look good quality-wise?
- ✅ Any errors?

If satisfied, proceed to Step 3.

---

### Step 3: Process Full Dataset (2-5 minutes)

```bash
# RECOMMENDED: Saves to new directory (originals safe)
python preprocess_advanced.py

# Or with custom options
python preprocess_advanced.py \
    --input-dir dataset \
    --output-dir dataset_224 \
    --size 224 \
    --mode crop \
    --format JPEG \
    --quality 95
```

**Done!** Your images are now in `dataset_processed/` (or your chosen output dir)

---

## 🎯 Common Use Cases

### Use Case 1: Standard PyTorch/TensorFlow Training

```bash
python preprocess_advanced.py --size 224 --mode crop
```

Perfect for ResNet, EfficientNet, MobileNet, etc.

### Use Case 2: Larger Models (ViT, Inception)

```bash
python preprocess_advanced.py --size 384 --mode crop
```

### Use Case 3: Product Image Retrieval

```bash
python preprocess_advanced.py \
    --size 224 \
    --mode crop \
    --enhance-contrast \
    --enhance-sharpness \
    --quality 98
```

### Use Case 4: Object Detection

```bash
python preprocess_advanced.py --size 416 --mode pad
```

Pad mode preserves complete objects.

---

## 📋 Two Scripts - Which One?

| Feature | `preprocess_dataset.py` | `preprocess_advanced.py` |
|---------|------------------------|-------------------------|
| **Overwrites originals** | ✅ Yes (use --backup) | ❌ No (saves to new dir) |
| **Speed** | Fast | Fast |
| **Enhancements** | No | Yes (contrast, sharpness) |
| **Metadata export** | No | Yes (JSON) |
| **Recommended for** | Quick in-place edits | Production ML pipelines |

**💡 Recommendation:** Use `preprocess_advanced.py` - it's safer and more feature-rich.

---

## 🔧 Essential Options

### Image Size
```bash
--size 224    # Standard (ImageNet)
--size 299    # Inception models
--size 384    # Vision Transformers
--size 512    # Larger models
```

### Resize Modes
```bash
--mode resize   # Simple resize (may distort)
--mode crop     # Center crop (recommended)
--mode pad      # Letterbox with black borders
```

### Output Format
```bash
--format JPEG --quality 95   # Standard (smaller files)
--format PNG                  # Lossless (larger files)
```

---

## ✅ Validation Checklist

After preprocessing, verify:

```bash
# Check dataset structure and statistics
python inspect_dataset.py

# Should show:
# - All images are 224x224 (or your target size)
# - All images are RGB mode
# - No failed/corrupted images
```

---

## 🚨 Common Issues

### "Dataset directory not found"
**Fix:** Run `python download_laptop_dataset.py` first

### "Images look stretched"
**Fix:** Use `--mode crop` instead of `--mode resize`

### "Important parts are cut off"
**Fix:** Use `--mode pad` to preserve full image

### "Files too large"
**Fix:** Reduce quality: `--quality 85`

---

## 💡 Pro Tips

1. **Always test first** - Use `test_preprocessing.py`
2. **Keep originals** - Use `preprocess_advanced.py` (doesn't overwrite)
3. **Match your model** - Check model requirements (size, normalization)
4. **Batch process** - Scripts handle entire dataset automatically
5. **Check results** - Use `inspect_dataset.py` to validate

---

## 📊 Expected Results

For laptop dataset (16 images):

**Before:**
```
Total images:     16
Sizes:            Mixed (1920x1080, 3676x2314, etc.)
Modes:            RGB, PNG, JPEG
Total size:       ~8-15 MB
```

**After (224x224, JPEG quality 95):**
```
Total images:     16
Sizes:            All 224x224
Modes:            All RGB
Total size:       ~3-4 MB
Success rate:     100%
```

---

## 🎓 Next Steps

After preprocessing:

1. **Validate dataset:**
   ```bash
   python inspect_dataset.py
   ```

2. **Use in your training script:**
   ```python
   from torchvision import datasets, transforms

   transform = transforms.Compose([
       transforms.ToTensor(),
       transforms.Normalize([0.485, 0.456, 0.406],
                          [0.229, 0.224, 0.225])
   ])

   dataset = datasets.ImageFolder('dataset_224', transform=transform)
   ```

3. **Train your model!** 🚀

---

## 📁 File Structure After Preprocessing

```
D:\code\do_an\
├── dataset/                          # Original (untouched)
│   ├── apple_macbook_pro_14inch/
│   └── ...
│
├── dataset_processed/                # Preprocessed (ready for ML)
│   ├── apple_macbook_pro_14inch/
│   │   ├── img_01.jpg               # 224x224 RGB JPEG
│   │   └── img_02.jpg
│   └── preprocessing_metadata.json  # Processing details
│
└── test_preprocessing/               # Test subset (optional)
    └── ...
```

---

## ⏱️ Time Estimates

| Dataset Size | Processing Time |
|--------------|----------------|
| 10-20 images | ~10 seconds |
| 100 images | ~1 minute |
| 1,000 images | ~5-10 minutes |
| 10,000 images | ~30-60 minutes |

*Times vary based on original image sizes and hardware*

---

## 🆘 Need Help?

1. **Check documentation:** `README_PREPROCESSING.md`
2. **Validate dataset:** `python inspect_dataset.py`
3. **Test on subset:** `python test_preprocessing.py`
4. **Check error messages** - scripts provide detailed error info

---

## 🎉 You're Ready!

```bash
# One command to rule them all:
python preprocess_advanced.py
```

Then start training your ML model! 🚀

---

**Questions?** Check the full documentation in `README_PREPROCESSING.md`
