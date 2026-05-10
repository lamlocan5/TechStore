"""
Dataset Inspector
Analyzes and validates the downloaded dataset structure.
"""

import os
from pathlib import Path
from collections import defaultdict
import json

DATASET_DIR = "dataset"


def get_image_files(directory):
    """Get all image files in a directory."""
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
    image_files = []

    for file in Path(directory).iterdir():
        if file.is_file() and file.suffix.lower() in image_extensions:
            image_files.append(file)

    return sorted(image_files)


def get_file_size_mb(file_path):
    """Get file size in megabytes."""
    return os.path.getsize(file_path) / (1024 * 1024)


def inspect_dataset(dataset_dir=DATASET_DIR):
    """
    Inspect and analyze dataset structure.

    Args:
        dataset_dir (str): Path to dataset directory

    Returns:
        dict: Dataset statistics and information
    """
    dataset_path = Path(dataset_dir)

    if not dataset_path.exists():
        print(f"❌ Dataset directory not found: {dataset_dir}")
        return None

    print(f"🔍 Inspecting dataset: {dataset_path.absolute()}")
    print("=" * 80)
    print()

    # Statistics
    stats = {
        'total_products': 0,
        'total_images': 0,
        'total_size_mb': 0,
        'products': [],
        'empty_folders': [],
        'file_formats': defaultdict(int),
        'size_distribution': {'small': 0, 'medium': 0, 'large': 0, 'xlarge': 0}
    }

    # Get all product folders
    product_folders = [f for f in dataset_path.iterdir() if f.is_dir()]

    if not product_folders:
        print("⚠ No product folders found in dataset directory")
        return stats

    stats['total_products'] = len(product_folders)

    # Analyze each product folder
    for product_folder in sorted(product_folders):
        product_name = product_folder.name
        image_files = get_image_files(product_folder)

        if not image_files:
            stats['empty_folders'].append(product_name)
            continue

        # Count images
        num_images = len(image_files)
        stats['total_images'] += num_images

        # Calculate total size for this product
        product_size = sum(get_file_size_mb(f) for f in image_files)
        stats['total_size_mb'] += product_size

        # Count file formats
        for img_file in image_files:
            ext = img_file.suffix.lower()
            stats['file_formats'][ext] += 1

            # Size distribution
            size_mb = get_file_size_mb(img_file)
            if size_mb < 0.1:  # < 100KB
                stats['size_distribution']['small'] += 1
            elif size_mb < 0.5:  # < 500KB
                stats['size_distribution']['medium'] += 1
            elif size_mb < 2.0:  # < 2MB
                stats['size_distribution']['large'] += 1
            else:  # >= 2MB
                stats['size_distribution']['xlarge'] += 1

        # Store product info
        stats['products'].append({
            'name': product_name,
            'images': num_images,
            'size_mb': product_size,
            'formats': list(set(f.suffix.lower() for f in image_files))
        })

    return stats


def print_report(stats):
    """Print detailed dataset report."""

    if not stats:
        return

    print("📊 DATASET SUMMARY")
    print("=" * 80)
    print(f"Total Products:     {stats['total_products']}")
    print(f"Total Images:       {stats['total_images']}")
    print(f"Total Size:         {stats['total_size_mb']:.2f} MB")

    if stats['total_products'] > 0:
        avg_images = stats['total_images'] / stats['total_products']
        avg_size = stats['total_size_mb'] / stats['total_products']
        print(f"Avg Images/Product: {avg_images:.1f}")
        print(f"Avg Size/Product:   {avg_size:.2f} MB")

    print()

    # File formats
    print("📁 FILE FORMATS")
    print("-" * 80)
    for fmt, count in sorted(stats['file_formats'].items()):
        percentage = (count / stats['total_images'] * 100) if stats['total_images'] > 0 else 0
        print(f"  {fmt:8} {count:5} images ({percentage:5.1f}%)")
    print()

    # Size distribution
    print("💾 SIZE DISTRIBUTION")
    print("-" * 80)
    size_labels = {
        'small': 'Small (<100 KB)',
        'medium': 'Medium (100KB-500KB)',
        'large': 'Large (500KB-2MB)',
        'xlarge': 'XLarge (>2MB)'
    }
    for size_cat, label in size_labels.items():
        count = stats['size_distribution'][size_cat]
        percentage = (count / stats['total_images'] * 100) if stats['total_images'] > 0 else 0
        print(f"  {label:25} {count:5} images ({percentage:5.1f}%)")
    print()

    # Products detail
    print("📦 PRODUCTS DETAIL")
    print("-" * 80)
    print(f"{'Product Name':<40} {'Images':>8} {'Size (MB)':>12} {'Formats':>15}")
    print("-" * 80)

    for product in sorted(stats['products'], key=lambda x: x['images'], reverse=True):
        formats_str = ', '.join(product['formats'])
        print(f"{product['name']:<40} {product['images']:>8} {product['size_mb']:>12.2f} {formats_str:>15}")

    print()

    # Empty folders warning
    if stats['empty_folders']:
        print("⚠ EMPTY FOLDERS")
        print("-" * 80)
        for folder in stats['empty_folders']:
            print(f"  - {folder}")
        print()

    print("=" * 80)


def validate_dataset(dataset_dir=DATASET_DIR, min_images_per_product=1):
    """
    Validate dataset structure and completeness.

    Args:
        dataset_dir (str): Path to dataset directory
        min_images_per_product (int): Minimum required images per product

    Returns:
        bool: True if dataset is valid
    """
    print("✅ VALIDATION CHECKS")
    print("=" * 80)

    dataset_path = Path(dataset_dir)
    issues = []

    # Check 1: Dataset directory exists
    if not dataset_path.exists():
        print("❌ Dataset directory does not exist")
        return False
    print("✓ Dataset directory exists")

    # Check 2: Has product folders
    product_folders = [f for f in dataset_path.iterdir() if f.is_dir()]
    if not product_folders:
        print("❌ No product folders found")
        return False
    print(f"✓ Found {len(product_folders)} product folders")

    # Check 3: Each folder has minimum images
    for product_folder in product_folders:
        images = get_image_files(product_folder)
        if len(images) < min_images_per_product:
            issues.append(f"'{product_folder.name}' has only {len(images)} images (min: {min_images_per_product})")

    if issues:
        print(f"⚠ Found {len(issues)} validation issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print(f"✓ All products have at least {min_images_per_product} image(s)")

    # Check 4: Valid image files
    total_images = 0
    corrupted = []
    for product_folder in product_folders:
        images = get_image_files(product_folder)
        total_images += len(images)
        for img in images:
            # Check if file has content
            if os.path.getsize(img) == 0:
                corrupted.append(str(img))

    if corrupted:
        print(f"❌ Found {len(corrupted)} empty/corrupted images:")
        for img in corrupted[:5]:  # Show first 5
            print(f"  - {img}")
        if len(corrupted) > 5:
            print(f"  ... and {len(corrupted) - 5} more")
    else:
        print(f"✓ All {total_images} images have content")

    print("=" * 80)
    print()

    is_valid = len(issues) == 0 and len(corrupted) == 0
    return is_valid


def export_stats_json(stats, output_file="dataset_stats.json"):
    """Export statistics to JSON file."""
    if not stats:
        return

    export_data = {
        'summary': {
            'total_products': stats['total_products'],
            'total_images': stats['total_images'],
            'total_size_mb': round(stats['total_size_mb'], 2)
        },
        'file_formats': dict(stats['file_formats']),
        'size_distribution': stats['size_distribution'],
        'products': stats['products'],
        'empty_folders': stats['empty_folders']
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"📄 Statistics exported to: {output_file}")


def main():
    """Main execution."""
    print("🔍 Dataset Inspector Tool")
    print("=" * 80)
    print()

    # Inspect dataset
    stats = inspect_dataset(DATASET_DIR)

    if stats:
        print_report(stats)

        # Validate
        is_valid = validate_dataset(DATASET_DIR, min_images_per_product=1)

        if is_valid:
            print("✅ Dataset validation passed!")
        else:
            print("⚠ Dataset validation found issues (see above)")

        print()

        # Export stats
        export_stats_json(stats)
        print()

    else:
        print("❌ Could not inspect dataset")


if __name__ == "__main__":
    main()
