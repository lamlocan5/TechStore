# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
"""
Script sinh du lieu test: 1000 san pham, variants, brands, categories
Output: seed_data.sql + products.csv (dung cho JMeter CSV Data Set)

Chay: python generate_seed_data.py
"""

import random
import csv
import os
from datetime import datetime

NOW = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ─────────────────────────────────────────────
# 1. BRANDS (20 thương hiệu)
# ─────────────────────────────────────────────
BRANDS = [
    (1,  "Apple",   "https://cdn.example.com/brands/apple.png"),
    (2,  "Samsung", "https://cdn.example.com/brands/samsung.png"),
    (3,  "Dell",    "https://cdn.example.com/brands/dell.png"),
    (4,  "HP",      "https://cdn.example.com/brands/hp.png"),
    (5,  "Lenovo",  "https://cdn.example.com/brands/lenovo.png"),
    (6,  "Asus",    "https://cdn.example.com/brands/asus.png"),
    (7,  "Acer",    "https://cdn.example.com/brands/acer.png"),
    (8,  "MSI",     "https://cdn.example.com/brands/msi.png"),
    (9,  "LG",      "https://cdn.example.com/brands/lg.png"),
    (10, "Sony",    "https://cdn.example.com/brands/sony.png"),
    (11, "Xiaomi",  "https://cdn.example.com/brands/xiaomi.png"),
    (12, "OPPO",    "https://cdn.example.com/brands/oppo.png"),
    (13, "Vivo",    "https://cdn.example.com/brands/vivo.png"),
    (14, "Realme",  "https://cdn.example.com/brands/realme.png"),
    (15, "OnePlus", "https://cdn.example.com/brands/oneplus.png"),
    (16, "Huawei",  "https://cdn.example.com/brands/huawei.png"),
    (17, "Nokia",   "https://cdn.example.com/brands/nokia.png"),
    (18, "Razer",   "https://cdn.example.com/brands/razer.png"),
    (19, "Gigabyte","https://cdn.example.com/brands/gigabyte.png"),
    (20, "Microsoft","https://cdn.example.com/brands/microsoft.png"),
]

# ─────────────────────────────────────────────
# 2. CATEGORIES (parent + children)
# ─────────────────────────────────────────────
# parent_id=NULL cho root categories
CATEGORIES = [
    # Root
    (1,  "Điện thoại",       None),
    (2,  "Laptop",            None),
    (3,  "Máy tính bảng",     None),
    (4,  "Phụ kiện",          None),
    (5,  "Màn hình",          None),
    (6,  "Âm thanh",          None),
    (7,  "Máy tính để bàn",   None),
    # Sub-categories
    (8,  "Điện thoại Android", 1),
    (9,  "iPhone",             1),
    (10, "Laptop gaming",      2),
    (11, "Laptop văn phòng",   2),
    (12, "Laptop đồ hoạ",      2),
    (13, "iPad",               3),
    (14, "Android tablet",     3),
    (15, "Sạc & cáp",          4),
    (16, "Ốp lưng",            4),
    (17, "Tai nghe có dây",    6),
    (18, "Tai nghe không dây", 6),
]

# brand_id → product name templates (category_id, name_prefix list)
PRODUCT_TEMPLATES = [
    # (brand_id, category_id, name_prefixes, base_price_list, base_price_sale)
    (1,  9,  ["iPhone 15", "iPhone 15 Pro", "iPhone 14", "iPhone 16", "iPhone 13"],          20000000, 18000000),
    (1,  2,  ["MacBook Air M2", "MacBook Pro M3", "MacBook Air M3", "MacBook Pro 14"],        30000000, 27000000),
    (1,  13, ["iPad Air", "iPad Pro 11", "iPad Mini", "iPad 10th Gen"],                       15000000, 13000000),
    (2,  8,  ["Galaxy S24", "Galaxy A55", "Galaxy Z Fold", "Galaxy S23 FE", "Galaxy A35"],    15000000, 13000000),
    (2,  10, ["Galaxy Book3 Pro", "Galaxy Book2 360"],                                         22000000, 20000000),
    (3,  10, ["Dell Gaming G15", "Dell Alienware M15", "Dell XPS 15"],                         28000000, 25000000),
    (3,  11, ["Dell Inspiron 15", "Dell Latitude 14", "Dell Vostro 15"],                       16000000, 14500000),
    (4,  10, ["HP Victus 15", "HP Omen 16", "HP Pavilion Gaming"],                             22000000, 20000000),
    (4,  11, ["HP EliteBook 840", "HP ProBook 450", "HP Envy 13"],                             18000000, 16000000),
    (5,  10, ["Lenovo Legion 5", "Lenovo LOQ 15", "Lenovo Legion Pro 5"],                      25000000, 23000000),
    (5,  11, ["Lenovo ThinkPad X1", "Lenovo IdeaPad 5", "Lenovo Yoga 7"],                      20000000, 18000000),
    (6,  10, ["Asus ROG Strix G15", "Asus TUF A15", "Asus ROG Zephyrus"],                     28000000, 26000000),
    (6,  11, ["Asus ZenBook 14", "Asus VivoBook 15", "Asus ExpertBook B9"],                    16000000, 14000000),
    (7,  10, ["Acer Nitro 5", "Acer Predator Helios 300", "Acer Aspire Vero"],                 20000000, 18000000),
    (8,  10, ["MSI Katana GF66", "MSI Raider GE76", "MSI Stealth 15M"],                       30000000, 27000000),
    (11, 8,  ["Xiaomi 14", "Xiaomi 13T", "Redmi Note 13", "Poco X6"],                          8000000,  7200000),
    (12, 8,  ["OPPO Find X7", "OPPO Reno 11", "OPPO A98", "OPPO A78"],                         8000000,  7000000),
    (13, 8,  ["Vivo V30", "Vivo Y36", "Vivo X100"],                                             7000000,  6500000),
    (18, 10, ["Razer Blade 15", "Razer Blade 14"],                                             45000000, 42000000),
    (20, 11, ["Surface Pro 9", "Surface Laptop 5", "Surface Book 3"],                          28000000, 26000000),
]

# Colors, RAMs, Storages, OS options
COLORS       = ["Đen", "Trắng", "Bạc", "Xanh", "Đỏ", "Xám", "Vàng", "Tím", "Hồng"]
RAMS         = [8, 16, 32, 64]
STORAGES     = [128, 256, 512, 1024]
CPU_MODELS   = ["Intel Core i5-13500H", "Intel Core i7-13700H", "Intel Core i9-13900H",
                 "AMD Ryzen 5 7535HS", "AMD Ryzen 7 7745HX", "Apple M2", "Apple M3", "Apple M3 Pro",
                 "Snapdragon 8 Gen 3", "Dimensity 9300", "Exynos 2400"]
GPU_MODELS   = ["NVIDIA RTX 4060", "NVIDIA RTX 4070", "NVIDIA RTX 4090", "NVIDIA RTX 3060",
                 "AMD Radeon RX 7600M", "Integrated Graphics", None]
OS_OPTIONS   = ["Windows 11 Home", "Windows 11 Pro", "macOS Sonoma", "Android 14", "iOS 17", "iPadOS 17"]


def slugify(name: str) -> str:
    import unicodedata, re
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^\w\s-]", "", name).strip().lower()
    name = re.sub(r"[\s_-]+", "-", name)
    return name


def generate_sql():
    lines = []

    lines.append("-- ==============================================")
    lines.append("-- SEED DATA: 1000 Products for JMeter Performance Test")
    lines.append(f"-- Generated: {NOW}")
    lines.append("-- Database: product_service")
    lines.append("-- ==============================================\n")
    lines.append("USE product_service;\n")
    lines.append("SET FOREIGN_KEY_CHECKS = 0;\n")

    # ── BRANDS ──
    lines.append("-- ── BRANDS ──────────────────────────────────")
    lines.append("TRUNCATE TABLE brands;")
    lines.append("INSERT INTO brands (id, name, logo) VALUES")
    brand_rows = [f"  ({b[0]}, '{b[1]}', '{b[2]}')" for b in BRANDS]
    lines.append(",\n".join(brand_rows) + ";\n")

    # ── CATEGORIES ──
    lines.append("-- ── CATEGORIES ──────────────────────────────")
    lines.append("TRUNCATE TABLE categories;")
    lines.append("INSERT INTO categories (id, name, parent_id) VALUES")
    cat_rows = [
        f"  ({c[0]}, '{c[1]}', {'NULL' if c[2] is None else c[2]})"
        for c in CATEGORIES
    ]
    lines.append(",\n".join(cat_rows) + ";\n")

    # ── PRODUCTS + VARIANTS ──
    lines.append("-- ── PRODUCTS ─────────────────────────────────")
    lines.append("TRUNCATE TABLE product_categories;")
    lines.append("TRUNCATE TABLE product_variants;")
    lines.append("TRUNCATE TABLE products;\n")

    product_inserts = []
    variant_inserts = []
    product_category_inserts = []

    product_id  = 1
    variant_id  = 1
    csv_rows    = []  # cho JMeter CSV

    random.seed(42)

    # Tạo đủ 1000 sản phẩm bằng cách lặp qua PRODUCT_TEMPLATES
    target = 1000
    template_cycle = 0

    while product_id <= target:
        tmpl = PRODUCT_TEMPLATES[template_cycle % len(PRODUCT_TEMPLATES)]
        template_cycle += 1

        brand_id     = tmpl[0]
        category_id  = tmpl[1]
        name_list    = tmpl[2]
        base_list    = tmpl[3]
        base_sale    = tmpl[4]

        base_name = random.choice(name_list)
        suffix    = f" #{product_id:04d}"
        name      = base_name + suffix
        slug      = slugify(name)

        # Biến động giá ±20%
        factor      = random.uniform(0.8, 1.2)
        price_list  = int(base_list * factor / 1000) * 1000
        price_sale  = int(base_sale * factor / 1000) * 1000

        short_desc  = f"Sản phẩm {name} - hiệu năng cao, thiết kế hiện đại, bảo hành chính hãng 12 tháng."
        description = (
            f"{short_desc} Được trang bị công nghệ tiên tiến nhất, "
            f"phù hợp cho cả công việc lẫn giải trí. "
            f"Màn hình sắc nét, pin bền, tản nhiệt tốt."
        )
        avatar    = f"https://cdn.example.com/products/product_{product_id}.jpg"
        images_j  = f'["https://cdn.example.com/products/product_{product_id}_1.jpg","https://cdn.example.com/products/product_{product_id}_2.jpg"]'
        status    = 1

        product_inserts.append(
            f"  ({product_id}, {brand_id}, '{name.replace(chr(39), chr(39)+chr(39))}', '{slug}', "
            f"'{short_desc.replace(chr(39), chr(39)+chr(39))}', "
            f"'{description.replace(chr(39), chr(39)+chr(39))}', "
            f"{price_list}, {price_sale}, "
            f"'{avatar}', '{images_j}', {status}, '{avatar}', '{NOW}', '{NOW}')"
        )

        # product_categories join
        product_category_inserts.append(f"  ({product_id}, {category_id})")

        # Tạo 2–4 variants cho mỗi sản phẩm
        num_variants = random.randint(2, 4)
        variant_colors_used = random.sample(COLORS, min(num_variants, len(COLORS)))

        for vi in range(num_variants):
            color       = variant_colors_used[vi % len(variant_colors_used)]
            ram         = random.choice(RAMS)
            storage     = random.choice(STORAGES)
            cpu         = random.choice(CPU_MODELS)
            gpu         = random.choice(GPU_MODELS)
            os_val      = random.choice(OS_OPTIONS)
            sku         = f"SKU-{product_id:04d}-{vi+1:02d}"
            stock       = random.randint(50, 500)
            weight      = random.randint(1200, 2500)
            v_factor    = random.uniform(0.95, 1.1)
            v_list      = int(price_list * v_factor / 1000) * 1000
            v_sale      = int(price_sale * v_factor / 1000) * 1000
            preorder    = 0

            gpu_val     = f"'{gpu}'" if gpu else "NULL"
            variant_inserts.append(
                f"  ({variant_id}, {product_id}, '{sku}', '{color}', "
                f"{ram}, {storage}, '{cpu}', NULL, {gpu_val}, NULL, '{os_val}', "
                f"{v_list}, {v_sale}, {stock}, {preorder}, {weight}, "
                f"'{NOW}', '{NOW}')"
            )

            csv_rows.append({
                "product_id": product_id,
                "variant_id": variant_id,
                "product_name": name,
                "brand_id": brand_id,
                "category_id": category_id,
                "price_list": v_list,
                "price_sale": v_sale,
                "stock": stock,
                "sku": sku,
            })

            variant_id += 1

        product_id += 1

    # Ghi products INSERT (batch 100)
    lines.append("INSERT INTO products")
    lines.append("  (id, brand_id, name, slug, short_description, description,")
    lines.append("   price_list, price_sale, avatar, images, status, first_image, created_at, updated_at)")
    lines.append("VALUES")
    batch = 100
    for i in range(0, len(product_inserts), batch):
        chunk = product_inserts[i:i+batch]
        is_last_batch = (i + batch) >= len(product_inserts)
        lines.append(",\n".join(chunk) + (";" if is_last_batch else ","))
    lines.append("")

    # product_categories
    lines.append("INSERT INTO product_categories (product_id, category_id) VALUES")
    for i in range(0, len(product_category_inserts), batch):
        chunk = product_category_inserts[i:i+batch]
        is_last = (i + batch) >= len(product_category_inserts)
        lines.append(",\n".join(chunk) + (";" if is_last else ","))
    lines.append("")

    # variants
    lines.append("INSERT INTO product_variants")
    lines.append("  (id, product_id, sku, color, ram_gb, storage_gb, cpu_model, igpu, gpu_model, chipset_model,")
    lines.append("   os, price_list, price_sale, stock, allow_preorder, weightg, created_at, updated_at)")
    lines.append("VALUES")
    for i in range(0, len(variant_inserts), batch):
        chunk = variant_inserts[i:i+batch]
        is_last = (i + batch) >= len(variant_inserts)
        lines.append(",\n".join(chunk) + (";" if is_last else ","))
    lines.append("")

    # Reset auto_increment
    lines.append(f"ALTER TABLE products AUTO_INCREMENT = {product_id};")
    lines.append(f"ALTER TABLE product_variants AUTO_INCREMENT = {variant_id};")
    lines.append(f"ALTER TABLE brands AUTO_INCREMENT = 21;")
    lines.append(f"ALTER TABLE categories AUTO_INCREMENT = 19;\n")
    lines.append("SET FOREIGN_KEY_CHECKS = 1;\n")
    lines.append(f"-- Done: {product_id-1} products, {variant_id-1} variants inserted.")

    return "\n".join(lines), csv_rows


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(out_dir, "seed_data.sql")
    csv_file = os.path.join(out_dir, "products.csv")

    print("[*] Generating seed data...")
    sql_content, csv_rows = generate_sql()

    # Write SQL
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print(f"[OK] SQL written -> {sql_file}")

    # Write CSV for JMeter
    fieldnames = ["product_id", "variant_id", "product_name", "brand_id",
                  "category_id", "price_list", "price_sale", "stock", "sku"]
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"[OK] CSV written -> {csv_file}")
    print(f"     Total products : 1000")
    print(f"     Total variants : {len(csv_rows)}")
    print(f"")
    print(f"[!] De import vao MySQL:")
    print(f"    mysql -u root -p product_service < seed_data.sql")


if __name__ == "__main__":
    main()
