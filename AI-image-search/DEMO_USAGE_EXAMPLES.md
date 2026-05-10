# 📝 Demo Usage Examples

Real-world examples of how to use the Photo Similarity Search Demo.

## Example 1: Basic Search

**Scenario**: You have a photo of a laptop and want to find similar models in your inventory.

### Steps:
1. Start the demo:
   ```bash
   python similarity_demo.py
   ```

2. Open browser to `http://localhost:7860`

3. Upload your laptop image

4. Click "Find Similar Images"

5. Results show:
   - 10 most similar laptops
   - Similarity scores (e.g., 0.9234 = 92.34% similar)
   - Product names/categories

**Expected Output**:
```
#1: apple_macbook_pro_14_inch - Similarity: 0.9456
#2: apple_macbook_pro_13_inch - Similarity: 0.8923
#3: dell_xps_14 - Similarity: 0.8456
...
```

## Example 2: Find Products by Color/Style

**Scenario**: Customer shows you a silver laptop, wants to see all similar silver laptops.

### Process:
1. Upload the silver laptop photo
2. Set results to 20 (max)
3. Search
4. Review all results - they'll be sorted by similarity
5. Top results will likely be other silver laptops

**Why it works**: ResNet50 captures color and style features automatically.

## Example 3: Product Comparison

**Scenario**: Compare how similar two product lines are.

### Method:
1. Upload photo from Product Line A
2. Check if products from Line B appear in results
3. High similarity scores = competing products
4. Low similarity scores = different market segments

## Example 4: Quality Control

**Scenario**: Verify if a new product photo matches existing listings.

### Steps:
1. Upload new product photo
2. Search for similar images
3. If similarity > 0.95: Likely the same product
4. If similarity 0.8-0.95: Similar model/variant
5. If similarity < 0.8: Different product

**Use Case**: Prevent duplicate listings, verify supplier images

## Example 5: Visual Search for Customers

**Scenario**: Build a "Find Similar Products" feature for e-commerce.

### Integration:
1. Customer uploads photo of desired product
2. Your system calls `search_similar_images()`
3. Display top 10 results
4. Show product details, prices, buy buttons

**Code Example**:
```python
from similarity_demo import initialize_search_engine
from PIL import Image

# Initialize once
engine = initialize_search_engine()

# For each customer search
customer_image = Image.open('customer_upload.jpg')
results = engine.find_similar_images(customer_image, top_k=10)

for result in results:
    print(f"Product: {result['class_name']}")
    print(f"Similarity: {result['similarity']:.2%}")
    print(f"Image: {result['image_path']}")
    print()
```

## Example 6: Dataset Quality Analysis

**Scenario**: Find duplicate or very similar images in your dataset.

### Process:
1. Upload an image from your dataset
2. Check similarity scores
3. Images with score > 0.99: Likely duplicates
4. Images with score > 0.95: Very similar (different angles?)

**Action**: Clean up duplicates to improve search quality

## Example 7: Benchmarking Different Models

**Scenario**: Test which model gives best results for your use case.

### Setup:
Edit `similarity_demo.py`:

```python
# Try different models
# Option 1: ResNet50 (default, balanced)
model_name='resnet50'

# Option 2: ResNet101 (slower, more accurate)
model_name='resnet101'

# Option 3: ResNet34 (faster, less features)
model_name='resnet34'
```

### Test:
1. Run with each model
2. Upload same test image
3. Compare results quality
4. Choose best for your needs

## Example 8: API Integration

**Scenario**: Integrate similarity search into your application.

### Simple API Wrapper:
```python
from flask import Flask, request, jsonify
from similarity_demo import initialize_search_engine
from PIL import Image
import io

app = Flask(__name__)
engine = initialize_search_engine()

@app.route('/search', methods=['POST'])
def search():
    # Get image from request
    image_file = request.files['image']
    image = Image.open(io.BytesIO(image_file.read()))

    # Search
    num_results = request.form.get('num_results', 10, type=int)
    results = engine.find_similar_images(image, top_k=num_results)

    # Format response
    return jsonify({
        'results': [
            {
                'product': r['class_name'],
                'similarity': r['similarity'],
                'image_path': r['relative_path']
            }
            for r in results
        ]
    })

if __name__ == '__main__':
    app.run(port=5000)
```

### Usage:
```bash
curl -X POST -F "image=@test.jpg" -F "num_results=10" http://localhost:5000/search
```

## Example 9: Batch Processing

**Scenario**: Process multiple images at once.

### Script:
```python
from similarity_demo import initialize_search_engine
from PIL import Image
from pathlib import Path
import json

# Initialize
engine = initialize_search_engine()

# Process directory
input_dir = Path('customer_uploads')
results_all = {}

for img_path in input_dir.glob('*.jpg'):
    print(f"Processing {img_path.name}...")

    image = Image.open(img_path)
    results = engine.find_similar_images(image, top_k=5)

    results_all[img_path.name] = [
        {
            'product': r['class_name'],
            'similarity': round(r['similarity'], 4)
        }
        for r in results
    ]

# Save results
with open('batch_results.json', 'w') as f:
    json.dump(results_all, f, indent=2)

print(f"Processed {len(results_all)} images")
```

## Example 10: Performance Monitoring

**Scenario**: Track search performance over time.

### Monitoring Code:
```python
import time
from similarity_demo import initialize_search_engine
from PIL import Image

engine = initialize_search_engine()

# Test image
test_image = Image.open('dataset/test_image.jpg')

# Measure performance
times = []
for i in range(10):
    start = time.time()
    results = engine.find_similar_images(test_image, top_k=10)
    elapsed = time.time() - start
    times.append(elapsed)
    print(f"Search {i+1}: {elapsed:.3f} seconds")

print(f"\nAverage: {sum(times)/len(times):.3f} seconds")
print(f"Min: {min(times):.3f} seconds")
print(f"Max: {max(times):.3f} seconds")
```

## Tips for Best Results

### 1. Image Quality
- **Use clear, well-lit photos**
- Avoid blurry or dark images
- Center the product in frame

### 2. Consistent Angles
- Similar viewing angles give better results
- Front-facing works best for comparisons

### 3. Background
- Clean backgrounds are better
- Complex backgrounds may affect similarity

### 4. Image Size
- Any size works (auto-resized to 224x224)
- Larger images don't improve accuracy

### 5. Understanding Scores

| Score Range | Meaning | Use Case |
|-------------|---------|----------|
| 0.95 - 1.0 | Nearly identical | Duplicate detection |
| 0.85 - 0.95 | Very similar | Same product line |
| 0.70 - 0.85 | Similar features | Related products |
| 0.50 - 0.70 | Somewhat similar | Broad category |
| < 0.50 | Different | Unrelated products |

## Common Patterns

### Pattern 1: Same Product, Different Angles
- **Similarity**: 0.90-0.98
- **Why**: Same features, different perspective

### Pattern 2: Product Variants (Same Model, Different Color)
- **Similarity**: 0.85-0.93
- **Why**: Identical shape, different color

### Pattern 3: Similar Models (Same Brand)
- **Similarity**: 0.75-0.88
- **Why**: Design language consistency

### Pattern 4: Competing Products
- **Similarity**: 0.65-0.80
- **Why**: Similar category, different brands

## Troubleshooting Unexpected Results

### Problem: All results have low similarity (< 0.5)

**Causes**:
- Query image very different from dataset
- Different product category
- Poor image quality

**Solutions**:
- Expand dataset with more variety
- Improve image quality
- Check if embeddings are normalized

### Problem: Results seem random

**Causes**:
- Embeddings not properly generated
- Model not loaded correctly
- Feature extraction failed

**Solutions**:
```bash
# Regenerate embeddings
python extract_features.py

# Verify embeddings
python -c "import pandas as pd; df = pd.read_csv('embeddings/all_embeddings.csv'); print(f'Loaded {len(df)} embeddings')"
```

### Problem: Same image returns similarity < 1.0

**Expected**: This is normal due to:
- Floating-point precision
- Normalization differences
- JPEG compression

**Typical**: 0.999-1.0 for exact matches

## Advanced Usage

### Custom Similarity Threshold
```python
results = engine.find_similar_images(image, top_k=50)

# Filter by threshold
filtered = [r for r in results if r['similarity'] > 0.8]
print(f"Found {len(filtered)} results above 80% similarity")
```

### Category-Specific Search
```python
# Get all Apple products
results = engine.find_similar_images(image, top_k=100)
apple_products = [r for r in results if 'apple' in r['class_name'].lower()]
```

### Weighted Results
```python
# Combine similarity with other factors
for result in results:
    # Example: Factor in product popularity
    score = result['similarity'] * 0.7 + product_popularity * 0.3
    result['weighted_score'] = score
```

---

**More Examples?** Check the Jupyter notebook: `similarity_explorer.ipynb`
