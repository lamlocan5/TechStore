# Image Dataset Downloader

Python scripts for downloading and organizing product images into a structured dataset for machine learning training.

## 📁 Files

1. **`download_dataset.py`** - Generic image downloader (works with any image URLs)
2. **`download_laptop_dataset.py`** - Specialized downloader for laptop_dataset.json
3. **`example_usage.py`** - Example showing how to use the generic downloader
4. **`laptop_dataset.json`** - Collected laptop image data (15 models)
5. **`laptop_dataset_summary.md`** - Detailed documentation of the laptop dataset

## 🚀 Quick Start

### Option 1: Download Laptop Dataset (16 images ready)

```bash
python download_laptop_dataset.py
```

This will:
- Read `laptop_dataset.json`
- Download 16 high-resolution laptop images
- Organize them into `dataset/` folder by brand and model
- Save metadata for each image

**Output structure:**
```
dataset/
├── apple_macbook_pro_14inch/
│   ├── img_01.jpg
│   ├── img_01_meta.txt
│   ├── img_02.jpg
│   └── img_02_meta.txt
├── apple_macbook_air_13inch/
│   ├── img_01.png
│   ├── img_01_meta.txt
│   └── ...
├── asus_zenbook_14_oled/
└── ...
```

### Option 2: Download Custom Images

Edit `example_usage.py` with your image URLs:

```python
images = {
    "product_name_1": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    "product_name_2": [
        "https://example.com/image3.jpg"
    ]
}
```

Then run:
```bash
python example_usage.py
```

### Option 3: Use as a Module

```python
from download_dataset import create_dataset, print_statistics

images = {
    "my_product": [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
    ]
}

stats = create_dataset(images, base_dir="my_dataset", skip_existing=True)
print_statistics(stats)
```

## 📋 Features

### ✨ Main Features

- **Structured Organization** - Each product gets its own subfolder
- **Sequential Naming** - Images named `img_01.jpg`, `img_02.jpg`, etc.
- **Skip Existing** - Optionally skip re-downloading existing folders
- **Retry Logic** - Automatic retry on download failures (3 attempts)
- **Progress Tracking** - Real-time progress with visual indicators
- **Error Handling** - Graceful handling of network errors and timeouts
- **Metadata Saving** - Saves product info, color, angle, description (laptop dataset)
- **Multiple Formats** - Supports JPG, PNG, WEBP, GIF
- **Relative URL Handling** - Automatically handles Apple's relative URLs

### 📊 Statistics Tracking

After download completes, you'll see:
- Total products processed
- Total images attempted
- Successfully downloaded
- Failed downloads
- Skipped images
- Success rate percentage

## ⚙️ Configuration

Edit these constants at the top of the script:

```python
DATASET_DIR = "dataset"      # Output folder name
TIMEOUT = 30                 # Download timeout (seconds)
RETRY_ATTEMPTS = 3           # Number of retry attempts
RETRY_DELAY = 2              # Delay between retries (seconds)
```

## 📦 Requirements

Install required packages:

```bash
pip install requests
```

That's it! The scripts use only standard library + requests.

## 🎯 Use Cases

### For Machine Learning Training

```python
from download_dataset import create_dataset

# Download training images
training_images = {
    "class_A": ["url1", "url2", "url3"],
    "class_B": ["url4", "url5", "url6"],
    "class_C": ["url7", "url8", "url9"]
}

create_dataset(training_images, base_dir="training_data")
```

### For Image Retrieval Models

```python
# Download query and gallery images separately
query_images = {
    "iphone_15": ["query_url1", "query_url2"],
    "samsung_s24": ["query_url3", "query_url4"]
}

gallery_images = {
    "iphone_15": ["gallery_url1", "gallery_url2", "gallery_url3"],
    "samsung_s24": ["gallery_url4", "gallery_url5", "gallery_url6"]
}

create_dataset(query_images, base_dir="dataset/query")
create_dataset(gallery_images, base_dir="dataset/gallery")
```

### For Product Recognition

The laptop dataset is perfect for product recognition training:
- 15 different laptop models
- Multiple angles per model
- Different colors
- High-resolution images (800x800+)

## 🛠️ Advanced Usage

### Custom File Naming

Modify the `get_file_extension()` function to customize naming:

```python
def get_file_extension(url, default='.jpg'):
    # Your custom logic here
    return ext
```

### Custom Folder Names

The `sanitize_folder_name()` function controls folder naming:

```python
def sanitize_folder_name(name):
    # Customize how product names become folder names
    return sanitized_name
```

### Skip Logic

Control when to skip existing folders:

```python
if product_path.exists() and skip_existing:
    existing_images = list(product_path.glob("img_*.jpg"))
    if len(existing_images) >= expected_count:  # Custom condition
        # Skip
```

## 📝 Dataset Structure

The scripts create this structure:

```
dataset/
├── product_1/
│   ├── img_01.jpg
│   ├── img_02.jpg
│   └── img_03.png
├── product_2/
│   ├── img_01.jpg
│   └── img_02.jpg
└── product_3/
    ├── img_01.webp
    ├── img_02.webp
    ├── img_03.webp
    └── img_04.webp
```

For laptop dataset with metadata:

```
dataset/
├── apple_macbook_pro_14inch/
│   ├── img_01.jpg
│   ├── img_01_meta.txt       # Brand, model, color, angle, description
│   ├── img_02.jpg
│   └── img_02_meta.txt
└── ...
```

## 🔍 Troubleshooting

### Download Fails with 403 Error

Some sites block automated downloads. The scripts use browser-like headers, but some sites (like Dell) have stricter protection. Try:
1. Visiting the URL in a browser first
2. Using a VPN
3. Adjusting the User-Agent header

### Images Don't Download (0 bytes)

- Check if URL requires authentication
- Some CDN URLs may expire - get fresh URLs
- Verify the URL actually points to an image

### Timeout Errors

Increase the timeout:
```python
TIMEOUT = 60  # Increase to 60 seconds
```

### Rate Limiting

Add delay between downloads:
```python
time.sleep(1)  # Wait 1 second between images
```

## 📊 Current Laptop Dataset Stats

**From laptop_dataset.json:**
- **Total models:** 15
- **Brands:** 7 (Apple, Dell, ASUS, HP, Lenovo, Acer, MSI)
- **Images ready to download:** 16 high-resolution URLs
- **Image formats:** JPG, PNG, WEBP
- **Resolution:** Minimum 800x800, many 2000px+
- **Colors:** 20+ color variations
- **Angles:** Front, side, top, back, display close-ups

## 🎓 Next Steps

1. **Download the dataset:**
   ```bash
   python download_laptop_dataset.py
   ```

2. **Add more images:**
   - Visit product pages in `laptop_dataset_summary.md`
   - Extract additional image URLs
   - Add them to `laptop_dataset.json`

3. **Train your model:**
   - Use the organized dataset structure
   - Images are ready for PyTorch, TensorFlow, etc.
   - Metadata files provide additional context

4. **Augment the dataset:**
   - Add rotation, flipping, color jittering
   - Use libraries like `albumentations` or `imgaug`

## 📄 License

These scripts are provided as-is for educational purposes. All downloaded images are property of their respective manufacturers. Ensure you have proper authorization before using images for commercial purposes.

## 🤝 Contributing

To add more laptop models to the dataset:
1. Search for official product pages
2. Extract high-resolution image URLs
3. Add entries to `laptop_dataset.json`
4. Follow the existing JSON structure

---

**Happy Dataset Building!** 🚀📸

For questions or issues, check the comments in the source code.
