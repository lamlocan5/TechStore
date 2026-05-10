# 🚀 Quick Start Guide - Photo Similarity Demo

Get the demo running in 3 simple steps!

## Step 1: Install Gradio

Open your terminal/command prompt and run:

```bash
pip install gradio
```

Or use the setup script (Windows):
```bash
setup_demo.bat
```

## Step 2: Make Sure Embeddings Exist

Check if you have the embeddings file:
- Look for `embeddings/all_embeddings.csv`

If it doesn't exist, generate it:
```bash
python extract_features.py
```

This will take a few minutes to process all images in your dataset.

## Step 3: Run the Demo

```bash
python similarity_demo.py
```

That's it! Your browser will open automatically to `http://localhost:7860`

## 📖 How to Use the Demo

1. **Upload any photo** - Drag and drop or click to browse
2. **Click "Find Similar Images"** - Wait a few seconds
3. **View results** - See the 10 most similar photos with similarity scores

## 🎯 What You Can Do

- ✅ Upload any photo (laptop, phone, any image)
- ✅ Adjust number of results (1-20)
- ✅ See similarity scores (0-1 scale)
- ✅ View product categories
- ✅ Try example images

## 🐛 Troubleshooting

### "Embeddings not found" error
```bash
python extract_features.py
```

### "ModuleNotFoundError: gradio"
```bash
pip install gradio
```

### Port already in use
Edit `similarity_demo.py` and change the port:
```python
demo.launch(server_port=8080)  # Change from 7860 to 8080
```

## 📊 System Requirements

- **Python**: 3.7 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **GPU**: Optional (speeds up processing)
- **Disk Space**: 2GB for models and embeddings

## ⚡ Performance Tips

1. **Use GPU** if available - 5-10x faster
2. **First search is slower** - Model needs to load
3. **Subsequent searches are fast** - Model stays in memory

## 🎓 Learn More

- Full documentation: `DEMO_README.md`
- Feature extraction: `README_FEATURE_EXTRACTION.md`
- Project overview: `PROJECT_OVERVIEW.md`

---

**Need help?** Check the full documentation or troubleshooting section in DEMO_README.md
