"""
Script để index sản phẩm điện thoại vào product_index.pkl
"""
import sys
import io
import json
import mysql.connector
from pathlib import Path

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Thêm thư mục app vào path
sys.path.insert(0, str(Path(__file__).parent))

from app.service import get_search_service
from app import config

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'database': 'profile_service',
    'user': 'root',
    'password': '1234'
}

def get_phone_products():
    """Lấy danh sách tất cả sản phẩm từ database"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT id, name, avatar, images
        FROM products
        WHERE status = 1
    """

    cursor.execute(query)
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    return products


def parse_images(product):
    """Parse URLs ảnh từ product"""
    image_urls = []

    # Thêm avatar nếu có
    if product.get('avatar'):
        image_urls.append(product['avatar'])

    # Parse images từ JSON
    if product.get('images'):
        try:
            images = product['images']
            if isinstance(images, str):
                images = json.loads(images)
            if isinstance(images, list):
                for img in images:
                    if img and img not in image_urls:
                        image_urls.append(img)
        except Exception as e:
            print(f"  Error parsing images: {e}")

    return image_urls


def main():
    print("=" * 60)
    print("Index Phone Products Script")
    print("=" * 60)

    # Khởi tạo service
    print("\n[1] Initializing AI Image Search Service...")
    service = get_search_service()
    service.initialize()

    # Lấy stats hiện tại
    stats = service.get_stats()
    print(f"    Current index: {stats['total_products']} products, {stats['total_images']} images")

    # Lấy danh sách sản phẩm
    print(f"\n[2] Fetching products...")
    products = get_phone_products()
    print(f"    Found {len(products)} products")

    if not products:
        print("    No products found. Exiting.")
        return

    # Index từng sản phẩm
    print("\n[3] Indexing products...")
    total_indexed = 0
    total_failed = 0

    for i, product in enumerate(products, 1):
        product_id = product['id']
        product_name = product['name']
        image_urls = parse_images(product)

        print(f"\n    [{i}/{len(products)}] Product {product_id}: {product_name[:50]}...")
        print(f"        Images: {len(image_urls)}")

        if not image_urls:
            print("        Skipped - no images")
            continue

        try:
            indexed, failed = service.index_product(product_id, image_urls)
            total_indexed += indexed
            total_failed += failed
            print(f"        Indexed: {indexed}, Failed: {failed}")
        except Exception as e:
            print(f"        Error: {e}")
            total_failed += len(image_urls)

    # Kết quả
    print("\n" + "=" * 60)
    print("INDEXING COMPLETE")
    print("=" * 60)
    stats = service.get_stats()
    print(f"Total products in index: {stats['total_products']}")
    print(f"Total images in index: {stats['total_images']}")
    print(f"Images indexed this run: {total_indexed}")
    print(f"Images failed this run: {total_failed}")
    print(f"\nIndex saved to: {config.INDEX_FILE}")


if __name__ == "__main__":
    main()
