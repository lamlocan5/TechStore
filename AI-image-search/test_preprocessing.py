"""
Test Preprocessing Script
Quick test to verify preprocessing works before running on full dataset.
"""

import os
from pathlib import Path
from PIL import Image
import shutil

# Test configuration
TEST_DIR = "test_preprocessing"
SAMPLE_SIZE = 2  # Number of images to test from each product


def create_test_subset(source_dir="dataset", test_dir=TEST_DIR, samples_per_product=SAMPLE_SIZE):
    """
    Create a small test subset of the dataset.

    Args:
        source_dir (str): Source dataset directory
        test_dir (str): Test directory to create
        samples_per_product (int): Number of samples per product
    """
    source_path = Path(source_dir)
    test_path = Path(test_dir)

    if not source_path.exists():
        print(f"❌ Source directory not found: {source_dir}")
        return False

    # Create test directory
    if test_path.exists():
        print(f"⚠ Test directory already exists: {test_dir}")
        response = input("  Delete and recreate? (y/n): ")
        if response.lower() == 'y':
            shutil.rmtree(test_path)
        else:
            return False

    test_path.mkdir(exist_ok=True)

    print(f"📁 Creating test subset in: {test_dir}")
    print("=" * 60)

    # Copy sample images from each product
    product_folders = [f for f in source_path.iterdir() if f.is_dir()]
    total_copied = 0

    for product_folder in product_folders:
        product_name = product_folder.name

        # Find image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
        image_files = [f for f in product_folder.iterdir()
                      if f.is_file() and f.suffix.lower() in image_extensions]

        if not image_files:
            continue

        # Take first N samples
        samples = image_files[:samples_per_product]

        # Create product folder in test dir
        test_product_folder = test_path / product_name
        test_product_folder.mkdir(exist_ok=True)

        print(f"{product_name}: copying {len(samples)} samples")

        # Copy samples
        for img_file in samples:
            dest_file = test_product_folder / img_file.name
            shutil.copy2(img_file, dest_file)
            total_copied += 1

    print("=" * 60)
    print(f"✓ Test subset created with {total_copied} images")
    print()
    return True


def analyze_images(directory):
    """
    Analyze images in a directory.

    Args:
        directory (str): Directory to analyze
    """
    dir_path = Path(directory)

    if not dir_path.exists():
        print(f"❌ Directory not found: {directory}")
        return

    print(f"🔍 Analyzing images in: {directory}")
    print("=" * 80)

    product_folders = [f for f in dir_path.iterdir() if f.is_dir()]

    if not product_folders:
        print("⚠ No product folders found")
        return

    print(f"{'Product':<30} {'Images':>8} {'Sizes':<30} {'Modes':<20}")
    print("-" * 80)

    for product_folder in sorted(product_folders):
        product_name = product_folder.name

        # Find images
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
        image_files = [f for f in product_folder.iterdir()
                      if f.is_file() and f.suffix.lower() in image_extensions]

        if not image_files:
            continue

        # Analyze images
        sizes = set()
        modes = set()

        for img_file in image_files:
            try:
                with Image.open(img_file) as img:
                    sizes.add(f"{img.width}x{img.height}")
                    modes.add(img.mode)
            except Exception:
                pass

        sizes_str = ', '.join(sorted(sizes))
        modes_str = ', '.join(sorted(modes))

        print(f"{product_name:<30} {len(image_files):>8} {sizes_str:<30} {modes_str:<20}")

    print("=" * 80)
    print()


def compare_before_after(original_dir, processed_dir):
    """
    Compare original and processed datasets.

    Args:
        original_dir (str): Original dataset directory
        processed_dir (str): Processed dataset directory
    """
    print("📊 BEFORE vs AFTER COMPARISON")
    print("=" * 80)

    print("\nBEFORE PREPROCESSING:")
    analyze_images(original_dir)

    print("\nAFTER PREPROCESSING:")
    analyze_images(processed_dir)


def main():
    """Main execution."""
    import sys

    print("🧪 Preprocessing Test Utility")
    print("=" * 80)
    print()

    # Check if dataset exists
    if not Path("dataset").exists():
        print("❌ Dataset directory not found!")
        print("   Please download the dataset first using download_laptop_dataset.py")
        return

    print("This utility helps you test preprocessing on a small subset")
    print("before running on your full dataset.")
    print()

    # Step 1: Create test subset
    print("STEP 1: Create Test Subset")
    print("-" * 80)

    if Path(TEST_DIR).exists():
        print(f"⚠ Test directory already exists: {TEST_DIR}")
        print("  You can:")
        print("  1. Delete it and create a new one")
        print("  2. Skip to preprocessing the existing test subset")
        choice = input("\nEnter choice (1/2): ")

        if choice == '1':
            shutil.rmtree(TEST_DIR)
            create_test_subset()
        elif choice == '2':
            pass
        else:
            print("Invalid choice")
            return
    else:
        create_test_subset()

    # Step 2: Analyze original
    print("\nSTEP 2: Analyze Original Test Images")
    print("-" * 80)
    analyze_images(TEST_DIR)

    # Step 3: Run preprocessing
    print("\nSTEP 3: Run Preprocessing")
    print("-" * 80)
    print("Choose preprocessing script:")
    print("  1. Basic preprocessing (overwrites originals)")
    print("  2. Advanced preprocessing (saves to new directory)")
    choice = input("\nEnter choice (1/2): ")

    if choice == '1':
        print("\n⚠ WARNING: This will overwrite images in test_preprocessing/")
        confirm = input("Continue? (y/n): ")
        if confirm.lower() == 'y':
            os.system(f"python preprocess_dataset.py --dataset-dir {TEST_DIR}")
            print("\n✓ Preprocessing complete")
            print("\nAnalyzing processed images:")
            analyze_images(TEST_DIR)
    elif choice == '2':
        output_dir = f"{TEST_DIR}_processed"
        print(f"\nProcessed images will be saved to: {output_dir}")
        os.system(f"python preprocess_advanced.py --input-dir {TEST_DIR} --output-dir {output_dir}")
        print("\n✓ Preprocessing complete")
        compare_before_after(TEST_DIR, output_dir)
    else:
        print("Invalid choice")
        return

    print("\n" + "=" * 80)
    print("✅ Test complete!")
    print("\nIf the test results look good, you can now run preprocessing")
    print("on your full dataset using the same command but with:")
    print("  --dataset-dir dataset")


if __name__ == "__main__":
    main()
