"""
Image Dataset Preprocessor
Preprocesses product images for machine learning training.
Resizes, converts to RGB, and optionally maintains aspect ratio.
"""

import os
from pathlib import Path
from PIL import Image, ImageOps
import traceback
from collections import defaultdict

# Configuration
DATASET_DIR = "dataset"
TARGET_SIZE = (224, 224)
RESIZE_MODE = "resize"  # Options: "resize", "crop", "pad"
BACKUP_ENABLED = False  # Set to True to create backups before overwriting
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}

# Statistics
stats = {
    'total_found': 0,
    'processed': 0,
    'skipped': 0,
    'failed': 0,
    'by_product': defaultdict(lambda: {'processed': 0, 'failed': 0}),
    'failed_files': []
}


def is_image_file(filepath):
    """
    Check if file is a supported image format.

    Args:
        filepath (Path): Path to file

    Returns:
        bool: True if supported image format
    """
    return filepath.suffix.lower() in SUPPORTED_FORMATS


def resize_image(image, target_size, mode="resize"):
    """
    Resize image using specified mode.

    Args:
        image (PIL.Image): Input image
        target_size (tuple): Target (width, height)
        mode (str): Resize mode - "resize", "crop", or "pad"

    Returns:
        PIL.Image: Resized image
    """
    if mode == "resize":
        # Simple resize (may distort aspect ratio)
        return image.resize(target_size, Image.Resampling.LANCZOS)

    elif mode == "crop":
        # Center crop maintaining aspect ratio
        # First resize so smallest dimension matches target
        img_ratio = image.width / image.height
        target_ratio = target_size[0] / target_size[1]

        if img_ratio > target_ratio:
            # Image is wider, fit to height
            new_height = target_size[1]
            new_width = int(new_height * img_ratio)
        else:
            # Image is taller, fit to width
            new_width = target_size[0]
            new_height = int(new_width / img_ratio)

        # Resize
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Center crop to target size
        left = (new_width - target_size[0]) // 2
        top = (new_height - target_size[1]) // 2
        right = left + target_size[0]
        bottom = top + target_size[1]

        return image.crop((left, top, right, bottom))

    elif mode == "pad":
        # Pad to target size maintaining aspect ratio
        # Thumbnail method maintains aspect ratio
        image.thumbnail(target_size, Image.Resampling.LANCZOS)

        # Create new image with target size (black background)
        new_image = Image.new('RGB', target_size, (0, 0, 0))

        # Calculate position to paste (center)
        paste_x = (target_size[0] - image.width) // 2
        paste_y = (target_size[1] - image.height) // 2

        # Paste resized image onto center
        new_image.paste(image, (paste_x, paste_y))

        return new_image

    else:
        raise ValueError(f"Unknown resize mode: {mode}")


def preprocess_image(image_path, target_size=TARGET_SIZE, mode=RESIZE_MODE, backup=BACKUP_ENABLED):
    """
    Preprocess a single image file.

    Args:
        image_path (Path): Path to image file
        target_size (tuple): Target size (width, height)
        mode (str): Resize mode
        backup (bool): Create backup before overwriting

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Open image
        with Image.open(image_path) as img:
            # Get original info
            original_size = img.size
            original_mode = img.mode

            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Resize image
            processed_img = resize_image(img, target_size, mode)

            # Create backup if enabled
            if backup:
                backup_path = image_path.parent / f"{image_path.stem}_backup{image_path.suffix}"
                img.save(backup_path)

            # Save processed image (overwrite original)
            processed_img.save(image_path, quality=95, optimize=True)

            return True, original_size, original_mode

    except Exception as e:
        return False, None, str(e)


def process_dataset(dataset_dir=DATASET_DIR, target_size=TARGET_SIZE, mode=RESIZE_MODE):
    """
    Process all images in the dataset directory.

    Args:
        dataset_dir (str): Path to dataset directory
        target_size (tuple): Target size for images
        mode (str): Resize mode
    """
    dataset_path = Path(dataset_dir)

    if not dataset_path.exists():
        print(f"❌ Error: Dataset directory not found: {dataset_dir}")
        return

    print("🔄 Image Dataset Preprocessor")
    print("=" * 80)
    print(f"Dataset directory: {dataset_path.absolute()}")
    print(f"Target size:       {target_size[0]}x{target_size[1]}")
    print(f"Resize mode:       {mode}")
    print(f"Backup enabled:    {BACKUP_ENABLED}")
    print("=" * 80)
    print()

    # Find all product folders
    product_folders = [f for f in dataset_path.iterdir() if f.is_dir()]

    if not product_folders:
        print("⚠ No product folders found in dataset")
        return

    print(f"📁 Found {len(product_folders)} product folders")
    print()

    # Process each product folder
    for product_idx, product_folder in enumerate(sorted(product_folders), 1):
        product_name = product_folder.name

        # Find all image files
        image_files = [f for f in product_folder.iterdir() if f.is_file() and is_image_file(f)]

        if not image_files:
            print(f"[{product_idx}/{len(product_folders)}] {product_name}")
            print(f"  ⊘ No images found")
            print()
            continue

        stats['total_found'] += len(image_files)

        print(f"[{product_idx}/{len(product_folders)}] {product_name}")
        print(f"  Images to process: {len(image_files)}")

        # Process each image
        for img_idx, image_file in enumerate(sorted(image_files), 1):
            print(f"  [{img_idx}/{len(image_files)}] {image_file.name}", end=" ")

            result = preprocess_image(image_file, target_size, mode, BACKUP_ENABLED)

            if result[0]:  # Success
                original_size, original_mode = result[1], result[2]
                print(f"✓ ({original_size[0]}x{original_size[1]} {original_mode} → {target_size[0]}x{target_size[1]} RGB)")
                stats['processed'] += 1
                stats['by_product'][product_name]['processed'] += 1
            else:
                error_msg = result[2]
                print(f"✗ Failed: {error_msg}")
                stats['failed'] += 1
                stats['by_product'][product_name]['failed'] += 1
                stats['failed_files'].append({
                    'path': str(image_file),
                    'error': error_msg
                })

        print()

    return stats


def print_summary(stats):
    """
    Print processing summary.

    Args:
        stats (dict): Statistics dictionary
    """
    print("=" * 80)
    print("📊 PROCESSING SUMMARY")
    print("=" * 80)
    print(f"Total images found:     {stats['total_found']}")
    print(f"✓ Successfully processed: {stats['processed']}")
    print(f"✗ Failed:                 {stats['failed']}")
    print(f"⊘ Skipped:                {stats['skipped']}")

    if stats['total_found'] > 0:
        success_rate = (stats['processed'] / stats['total_found']) * 100
        print(f"Success rate:           {success_rate:.1f}%")

    print()

    # Per-product breakdown
    if stats['by_product']:
        print("📦 PER-PRODUCT BREAKDOWN")
        print("-" * 80)
        print(f"{'Product':<40} {'Processed':>12} {'Failed':>10}")
        print("-" * 80)

        for product_name, product_stats in sorted(stats['by_product'].items()):
            print(f"{product_name:<40} {product_stats['processed']:>12} {product_stats['failed']:>10}")

        print()

    # Failed files detail
    if stats['failed_files']:
        print("❌ FAILED FILES")
        print("-" * 80)
        for failed in stats['failed_files']:
            print(f"  {failed['path']}")
            print(f"    Error: {failed['error']}")
        print()

    print("=" * 80)


def validate_processed_dataset(dataset_dir=DATASET_DIR, expected_size=TARGET_SIZE):
    """
    Validate that all images have been properly processed.

    Args:
        dataset_dir (str): Path to dataset directory
        expected_size (tuple): Expected image size

    Returns:
        dict: Validation results
    """
    print("✅ VALIDATING PROCESSED DATASET")
    print("=" * 80)

    dataset_path = Path(dataset_dir)
    validation = {
        'total_checked': 0,
        'correct_size': 0,
        'incorrect_size': 0,
        'correct_mode': 0,
        'incorrect_mode': 0,
        'issues': []
    }

    product_folders = [f for f in dataset_path.iterdir() if f.is_dir()]

    for product_folder in product_folders:
        image_files = [f for f in product_folder.iterdir() if f.is_file() and is_image_file(f)]

        for image_file in image_files:
            validation['total_checked'] += 1

            try:
                with Image.open(image_file) as img:
                    # Check size
                    if img.size == expected_size:
                        validation['correct_size'] += 1
                    else:
                        validation['incorrect_size'] += 1
                        validation['issues'].append({
                            'file': str(image_file),
                            'issue': f"Wrong size: {img.size} (expected {expected_size})"
                        })

                    # Check mode
                    if img.mode == 'RGB':
                        validation['correct_mode'] += 1
                    else:
                        validation['incorrect_mode'] += 1
                        validation['issues'].append({
                            'file': str(image_file),
                            'issue': f"Wrong mode: {img.mode} (expected RGB)"
                        })

            except Exception as e:
                validation['issues'].append({
                    'file': str(image_file),
                    'issue': f"Cannot read: {str(e)}"
                })

    # Print validation results
    print(f"Total images checked:   {validation['total_checked']}")
    print(f"✓ Correct size:         {validation['correct_size']}")
    print(f"✗ Incorrect size:       {validation['incorrect_size']}")
    print(f"✓ Correct mode (RGB):   {validation['correct_mode']}")
    print(f"✗ Incorrect mode:       {validation['incorrect_mode']}")
    print()

    if validation['issues']:
        print(f"⚠ Found {len(validation['issues'])} issues:")
        for issue in validation['issues'][:10]:  # Show first 10
            print(f"  {issue['file']}")
            print(f"    {issue['issue']}")
        if len(validation['issues']) > 10:
            print(f"  ... and {len(validation['issues']) - 10} more")
        print()
    else:
        print("✅ All images are properly processed!")
        print()

    print("=" * 80)
    print()

    return validation


def main():
    """Main execution."""
    import argparse

    parser = argparse.ArgumentParser(description='Preprocess dataset images for ML training')
    parser.add_argument('--dataset-dir', type=str, default=DATASET_DIR,
                        help=f'Path to dataset directory (default: {DATASET_DIR})')
    parser.add_argument('--size', type=int, default=224,
                        help='Target image size (default: 224)')
    parser.add_argument('--mode', type=str, choices=['resize', 'crop', 'pad'], default=RESIZE_MODE,
                        help=f'Resize mode (default: {RESIZE_MODE})')
    parser.add_argument('--backup', action='store_true',
                        help='Create backups before overwriting')
    parser.add_argument('--validate-only', action='store_true',
                        help='Only validate dataset without processing')

    args = parser.parse_args()

    # Update global config
    global DATASET_DIR, TARGET_SIZE, RESIZE_MODE, BACKUP_ENABLED
    DATASET_DIR = args.dataset_dir
    TARGET_SIZE = (args.size, args.size)
    RESIZE_MODE = args.mode
    BACKUP_ENABLED = args.backup

    if args.validate_only:
        # Validation only mode
        validate_processed_dataset(DATASET_DIR, TARGET_SIZE)
    else:
        # Process dataset
        process_stats = process_dataset(DATASET_DIR, TARGET_SIZE, RESIZE_MODE)

        if process_stats:
            # Print summary
            print_summary(process_stats)

            # Validate processed dataset
            if process_stats['processed'] > 0:
                print()
                validate_processed_dataset(DATASET_DIR, TARGET_SIZE)

            print("✅ Preprocessing complete!")

            if process_stats['failed'] > 0:
                print(f"⚠ Warning: {process_stats['failed']} images failed to process")
                print("   Check the failed files list above for details")


if __name__ == "__main__":
    main()
