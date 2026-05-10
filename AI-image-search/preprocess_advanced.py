"""
Advanced Image Dataset Preprocessor
Enhanced preprocessing with normalization, augmentation, and export options.
"""

import os
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import json
from collections import defaultdict

# Configuration
DATASET_DIR = "dataset"
OUTPUT_DIR = "dataset_processed"  # Save to new directory instead of overwriting
TARGET_SIZE = (224, 224)
RESIZE_MODE = "crop"  # resize, crop, or pad

# Preprocessing options
NORMALIZE = True  # Normalize to [0, 1] range
ENHANCE_CONTRAST = False  # Auto-enhance contrast
ENHANCE_SHARPNESS = False  # Enhance sharpness
AUTO_ORIENT = True  # Fix orientation based on EXIF

# Quality settings
SAVE_FORMAT = "JPEG"  # JPEG or PNG
JPEG_QUALITY = 95
OPTIMIZE = True


class ImagePreprocessor:
    """Image preprocessing pipeline for ML datasets."""

    def __init__(self, target_size=(224, 224), resize_mode="crop"):
        self.target_size = target_size
        self.resize_mode = resize_mode
        self.stats = defaultdict(int)
        self.failed_files = []

    def auto_orient(self, image):
        """
        Fix image orientation based on EXIF data.

        Args:
            image (PIL.Image): Input image

        Returns:
            PIL.Image: Correctly oriented image
        """
        try:
            # Check for EXIF orientation tag
            exif = image._getexif()
            if exif is not None:
                orientation = exif.get(274)  # 274 is the orientation tag
                if orientation == 3:
                    image = image.rotate(180, expand=True)
                elif orientation == 6:
                    image = image.rotate(270, expand=True)
                elif orientation == 8:
                    image = image.rotate(90, expand=True)
        except (AttributeError, KeyError, IndexError):
            # No EXIF data or no orientation tag
            pass

        return image

    def resize_image(self, image):
        """
        Resize image using configured mode.

        Args:
            image (PIL.Image): Input image

        Returns:
            PIL.Image: Resized image
        """
        if self.resize_mode == "resize":
            return image.resize(self.target_size, Image.Resampling.LANCZOS)

        elif self.resize_mode == "crop":
            # Center crop with aspect ratio preservation
            img_ratio = image.width / image.height
            target_ratio = self.target_size[0] / self.target_size[1]

            if img_ratio > target_ratio:
                new_height = self.target_size[1]
                new_width = int(new_height * img_ratio)
            else:
                new_width = self.target_size[0]
                new_height = int(new_width / img_ratio)

            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

            left = (new_width - self.target_size[0]) // 2
            top = (new_height - self.target_size[1]) // 2
            right = left + self.target_size[0]
            bottom = top + self.target_size[1]

            return image.crop((left, top, right, bottom))

        elif self.resize_mode == "pad":
            # Pad with black borders
            image.thumbnail(self.target_size, Image.Resampling.LANCZOS)
            new_image = Image.new('RGB', self.target_size, (0, 0, 0))
            paste_x = (self.target_size[0] - image.width) // 2
            paste_y = (self.target_size[1] - image.height) // 2
            new_image.paste(image, (paste_x, paste_y))
            return new_image

    def enhance_image(self, image, contrast=False, sharpness=False):
        """
        Apply image enhancements.

        Args:
            image (PIL.Image): Input image
            contrast (bool): Auto-enhance contrast
            sharpness (bool): Enhance sharpness

        Returns:
            PIL.Image: Enhanced image
        """
        if contrast:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)  # Increase contrast by 20%

        if sharpness:
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.5)  # Increase sharpness by 50%

        return image

    def process_image(self, input_path, output_path):
        """
        Process a single image through the pipeline.

        Args:
            input_path (Path): Input image path
            output_path (Path): Output image path

        Returns:
            dict: Processing result with metadata
        """
        try:
            with Image.open(input_path) as img:
                # Store original metadata
                original_size = img.size
                original_mode = img.mode
                original_format = img.format

                # Auto-orient
                if AUTO_ORIENT:
                    img = self.auto_orient(img)

                # Convert to RGB
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Resize
                img = self.resize_image(img)

                # Enhancements
                img = self.enhance_image(img, ENHANCE_CONTRAST, ENHANCE_SHARPNESS)

                # Create output directory
                output_path.parent.mkdir(parents=True, exist_ok=True)

                # Save processed image
                save_kwargs = {'optimize': OPTIMIZE}
                if SAVE_FORMAT == 'JPEG':
                    save_kwargs['quality'] = JPEG_QUALITY

                img.save(output_path, format=SAVE_FORMAT, **save_kwargs)

                self.stats['processed'] += 1

                return {
                    'success': True,
                    'original_size': original_size,
                    'original_mode': original_mode,
                    'original_format': original_format,
                    'new_size': self.target_size,
                    'new_mode': 'RGB',
                    'output_path': str(output_path)
                }

        except Exception as e:
            self.stats['failed'] += 1
            self.failed_files.append({
                'input_path': str(input_path),
                'error': str(e)
            })

            return {
                'success': False,
                'error': str(e)
            }

    def process_dataset(self, input_dir, output_dir):
        """
        Process entire dataset directory.

        Args:
            input_dir (str): Input dataset directory
            output_dir (str): Output directory for processed images

        Returns:
            dict: Processing statistics
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)

        if not input_path.exists():
            print(f"❌ Error: Input directory not found: {input_dir}")
            return None

        print("🔄 Advanced Image Dataset Preprocessor")
        print("=" * 80)
        print(f"Input directory:   {input_path.absolute()}")
        print(f"Output directory:  {output_path.absolute()}")
        print(f"Target size:       {self.target_size[0]}x{self.target_size[1]}")
        print(f"Resize mode:       {self.resize_mode}")
        print(f"Auto-orient:       {AUTO_ORIENT}")
        print(f"Enhance contrast:  {ENHANCE_CONTRAST}")
        print(f"Enhance sharpness: {ENHANCE_SHARPNESS}")
        print(f"Save format:       {SAVE_FORMAT}")
        if SAVE_FORMAT == 'JPEG':
            print(f"JPEG quality:      {JPEG_QUALITY}")
        print("=" * 80)
        print()

        # Find all product folders
        product_folders = [f for f in input_path.iterdir() if f.is_dir()]

        if not product_folders:
            print("⚠ No product folders found")
            return None

        print(f"📁 Found {len(product_folders)} product folders")
        print()

        # Process metadata
        metadata = {
            'preprocessing': {
                'target_size': self.target_size,
                'resize_mode': self.resize_mode,
                'auto_orient': AUTO_ORIENT,
                'enhance_contrast': ENHANCE_CONTRAST,
                'enhance_sharpness': ENHANCE_SHARPNESS,
                'save_format': SAVE_FORMAT
            },
            'products': {}
        }

        # Process each product folder
        for product_idx, product_folder in enumerate(sorted(product_folders), 1):
            product_name = product_folder.name

            # Find image files
            image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
            image_files = [f for f in product_folder.iterdir()
                          if f.is_file() and f.suffix.lower() in image_extensions]

            if not image_files:
                print(f"[{product_idx}/{len(product_folders)}] {product_name}")
                print(f"  ⊘ No images found")
                print()
                continue

            self.stats['total_found'] += len(image_files)

            print(f"[{product_idx}/{len(product_folders)}] {product_name}")
            print(f"  Images: {len(image_files)}")

            # Create output folder
            output_product_folder = output_path / product_name

            # Store product metadata
            product_metadata = {
                'total_images': len(image_files),
                'images': []
            }

            # Process each image
            for img_idx, image_file in enumerate(sorted(image_files), 1):
                # Determine output filename
                if SAVE_FORMAT == 'JPEG':
                    output_filename = f"{image_file.stem}.jpg"
                else:
                    output_filename = f"{image_file.stem}.png"

                output_file = output_product_folder / output_filename

                print(f"  [{img_idx}/{len(image_files)}] {image_file.name} → {output_filename} ", end="")

                # Process image
                result = self.process_image(image_file, output_file)

                if result['success']:
                    print(f"✓ ({result['original_size'][0]}x{result['original_size'][1]} → "
                          f"{result['new_size'][0]}x{result['new_size'][1]})")

                    # Add to metadata
                    product_metadata['images'].append({
                        'original_name': image_file.name,
                        'processed_name': output_filename,
                        'original_size': result['original_size'],
                        'processed_size': result['new_size']
                    })
                else:
                    print(f"✗ {result['error']}")

            metadata['products'][product_name] = product_metadata
            print()

        # Save metadata
        metadata_file = output_path / 'preprocessing_metadata.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        print(f"📄 Metadata saved to: {metadata_file}")
        print()

        return self.stats


def print_summary(stats, failed_files):
    """Print processing summary."""
    print("=" * 80)
    print("📊 PROCESSING SUMMARY")
    print("=" * 80)
    print(f"Total images found:      {stats['total_found']}")
    print(f"✓ Successfully processed: {stats['processed']}")
    print(f"✗ Failed:                 {stats['failed']}")

    if stats['total_found'] > 0:
        success_rate = (stats['processed'] / stats['total_found']) * 100
        print(f"Success rate:            {success_rate:.1f}%")

    print()

    if failed_files:
        print("❌ FAILED FILES")
        print("-" * 80)
        for failed in failed_files[:10]:
            print(f"  {failed['input_path']}")
            print(f"    Error: {failed['error']}")
        if len(failed_files) > 10:
            print(f"  ... and {len(failed_files) - 10} more")
        print()

    print("=" * 80)


def main():
    """Main execution."""
    import argparse
    # Update global config
    global OUTPUT_DIR, TARGET_SIZE, RESIZE_MODE, ENHANCE_CONTRAST, ENHANCE_SHARPNESS
    global SAVE_FORMAT, JPEG_QUALITY

    parser = argparse.ArgumentParser(description='Advanced image preprocessing for ML datasets')
    parser.add_argument('--input-dir', type=str, default=DATASET_DIR,
                        help=f'Input dataset directory (default: {DATASET_DIR})')
    parser.add_argument('--output-dir', type=str, default=OUTPUT_DIR,
                        help=f'Output directory (default: {OUTPUT_DIR})')
    parser.add_argument('--size', type=int, default=224,
                        help='Target image size (default: 224)')
    parser.add_argument('--mode', type=str, choices=['resize', 'crop', 'pad'], default='crop',
                        help='Resize mode (default: crop)')
    parser.add_argument('--enhance-contrast', action='store_true',
                        help='Auto-enhance contrast')
    parser.add_argument('--enhance-sharpness', action='store_true',
                        help='Enhance sharpness')
    parser.add_argument('--format', type=str, choices=['JPEG', 'PNG'], default='JPEG',
                        help='Output format (default: JPEG)')
    parser.add_argument('--quality', type=int, default=95,
                        help='JPEG quality (default: 95)')

    args = parser.parse_args()

    OUTPUT_DIR = args.output_dir
    TARGET_SIZE = (args.size, args.size)
    RESIZE_MODE = args.mode
    ENHANCE_CONTRAST = args.enhance_contrast
    ENHANCE_SHARPNESS = args.enhance_sharpness
    SAVE_FORMAT = args.format
    JPEG_QUALITY = args.quality

    # Create preprocessor
    preprocessor = ImagePreprocessor(target_size=TARGET_SIZE, resize_mode=RESIZE_MODE)

    # Process dataset
    stats = preprocessor.process_dataset(args.input_dir, args.output_dir)

    if stats:
        print_summary(stats, preprocessor.failed_files)
        print("✅ Preprocessing complete!")
        print(f"📂 Processed images saved to: {args.output_dir}")


if __name__ == "__main__":
    main()
