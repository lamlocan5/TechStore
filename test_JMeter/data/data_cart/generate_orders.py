# -*- coding: utf-8 -*-
import sys, re, random, os
sys.stdout.reconfigure(encoding='utf-8')

"""
Sinh 100 don hang (orders) va order_items tuong ung.
Dung user_id trich xuat tu seed_users.sql va variant_id tu products.csv.

Output: seed_orders.sql
Luu tai: C:/Users/Admin/Desktop/PTIT/Y4_T2/QA/SQA/test_JMeter/data/data_cart/
"""

# ── Paths ──────────────────────────────────────────
USERS_SQL  = r"C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user\seed_users.sql"
PRODUCTS_CSV = r"C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_chung\products.csv"
OUT_DIR    = r"C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_cart"
OUT_FILE   = os.path.join(OUT_DIR, "seed_orders.sql")

NOW        = "2026-05-01 10:00:00"
random.seed(99)

# Spread orders across Jan-May 2026 (phu hop nam hien tai de thong ke hoat dong)
DATE_SLOTS = [
    # (created_at,              paid_at,                  shipped_at,              completed_at)
    ("2026-01-10 09:00:00", "2026-01-10 09:30:00", "2026-01-11 08:00:00", "2026-01-12 14:00:00"),
    ("2026-01-20 10:00:00", "2026-01-20 10:15:00", "2026-01-21 09:00:00", "2026-01-22 15:00:00"),
    ("2026-02-05 11:00:00", "2026-02-05 11:20:00", "2026-02-06 08:00:00", "2026-02-07 14:00:00"),
    ("2026-02-15 14:00:00", "2026-02-15 14:10:00", "2026-02-16 09:00:00", "2026-02-17 13:00:00"),
    ("2026-03-01 08:30:00", "2026-03-01 09:00:00", "2026-03-02 08:00:00", "2026-03-03 14:00:00"),
    ("2026-03-15 10:00:00", "2026-03-15 10:05:00", "2026-03-16 08:00:00", "2026-03-17 14:00:00"),
    ("2026-03-25 16:00:00", "2026-03-25 16:30:00", "2026-03-26 10:00:00", "2026-03-27 15:00:00"),
    ("2026-04-05 09:00:00", "2026-04-05 09:20:00", "2026-04-06 08:00:00", "2026-04-07 14:00:00"),
    ("2026-04-18 13:00:00", "2026-04-18 13:15:00", "2026-04-19 09:00:00", "2026-04-20 16:00:00"),
    ("2026-05-02 10:00:00", "2026-05-02 10:10:00", "2026-05-03 08:00:00", "2026-05-04 14:00:00"),
    ("2026-05-06 11:00:00", None, None, None),
    ("2026-05-07 08:00:00", None, None, None),
]

# ── 1. Lay 100 user_id tu seed_users.sql ──────────────
print("[*] Reading user IDs from seed_users.sql...")
with open(USERS_SQL, encoding="utf-8") as f:
    content = f.read()

pattern  = r"'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'"
all_uuids = list(dict.fromkeys(re.findall(pattern, content)))
user_ids  = all_uuids[:100]   # nua dau la user_id, nua sau la profile_id
print(f"    Got {len(user_ids)} user_ids")

# ── 2. Doc variants tu products.csv ────────────────────
print("[*] Reading variants from products.csv...")
import csv as csv_mod
variants = []
with open(PRODUCTS_CSV, encoding="utf-8") as f:
    reader = csv_mod.DictReader(f)
    for row in reader:
        variants.append({
            "product_id":   int(row["product_id"]),
            "variant_id":   int(row["variant_id"]),
            "product_name": row["product_name"],
            "price_sale":   int(row["price_sale"]),
            "sku":          row["sku"],
        })
print(f"    Got {len(variants)} variants from CSV")

# ── 3. Enum values ────────────────────────────────────
# OrderStatus: PENDING, PAID, SHIPPING, COMPLETED, CANCELLED
# PaymentStatus: UNPAID, PAID, REFUNDED
# PaymentMethod: COD, VNPAY, MOMO, BANK
ORDER_STATUSES = [
    "PENDING",
    "PAID",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED",
]
STATUS_WEIGHTS = [10, 15, 15, 50, 10]
PAYMENT_METHODS = ["COD", "VNPAY", "MOMO", "BANK"]
ORDER_TYPES     = ["NORMAL"]
SHIPPING_FEE    = 30000

# ── 4. Sinh du lieu ───────────────────────────────────
print("[*] Generating 100 orders...")

sql_lines = []
sql_lines.append("-- ==============================================")
sql_lines.append("-- SEED DATA: 100 Orders + Order Items (JMeter)")
sql_lines.append(f"-- Database: profile_service (order-service)")
sql_lines.append("-- ==============================================\n")
sql_lines.append("USE profile_service;\n")
sql_lines.append("SET FOREIGN_KEY_CHECKS = 0;\n")

order_vals     = []
order_item_vals = []

order_id      = 1
order_item_id = 1

for i in range(100):
    user_id = user_ids[i % len(user_ids)]

    # Chon date slot theo index, loop lai neu can
    date_slot     = DATE_SLOTS[i % len(DATE_SLOTS)]
    created_at    = date_slot[0]
    paid_at_base  = date_slot[1]
    shipped_at_base = date_slot[2]
    completed_at_base = date_slot[3]

    # Chon status ngau nhien (trong do 50% COMPLETED de co history)
    order_status  = random.choices(ORDER_STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
    payment_method = random.choice(PAYMENT_METHODS)

    # Xac dinh pay_status va cac timestamp theo status
    if order_status == "COMPLETED":
        pay_status   = "PAID"
        paid_at      = paid_at_base
        shipped_at   = shipped_at_base
        completed_at = completed_at_base
    elif order_status == "SHIPPING":
        pay_status   = "PAID"
        paid_at      = paid_at_base
        shipped_at   = shipped_at_base
        completed_at = None
    elif order_status == "PAID":
        pay_status   = "PAID"
        paid_at      = paid_at_base
        shipped_at   = None
        completed_at = None
    elif order_status == "PENDING":
        pay_status   = "UNPAID"
        paid_at      = None
        shipped_at   = None
        completed_at = None
    else:  # CANCELLED
        pay_status   = "UNPAID"
        paid_at      = None
        shipped_at   = None
        completed_at = None

    # Chon 1-3 variants ngau nhien lam order items
    num_items   = random.randint(1, 3)
    chosen_vars = random.sample(variants, num_items)
    subtotal    = 0
    items_data  = []

    for v in chosen_vars:
        qty   = random.randint(1, 3)
        price = v["price_sale"]
        total_item = qty * price
        subtotal  += total_item
        items_data.append((v["product_id"], v["variant_id"], v["product_name"], v["sku"], qty, price, total_item))

    discount    = 0
    total_order = subtotal + SHIPPING_FEE - discount

    def ts(val):
        return f"'{val}'" if val else "NULL"

    order_vals.append(
        f"  ({order_id}, '{user_id}', NULL, NULL, "
        f"'{order_status}', '{payment_method}', '{pay_status}', 'NORMAL', "
        f"{subtotal}, {discount}, {SHIPPING_FEE}, {total_order}, "
        f"NULL, '{created_at}', {ts(paid_at)}, {ts(shipped_at)}, {ts(completed_at)}, NULL)"
    )

    for (pid, vid, pname, sku, qty, price, item_total) in items_data:
        pname_esc = pname.replace("'", "''")
        order_item_vals.append(
            f"  ({order_item_id}, {order_id}, {pid}, {vid}, '{pname_esc}', '{sku}', "
            f"NULL, {qty}, {price}, {item_total}, '{created_at}')"
        )
        order_item_id += 1

    order_id += 1

# ── INSERT orders ──────────────────────────────────────
sql_lines.append("-- ── INSERT orders ────────────────────────────────────")
sql_lines.append("INSERT INTO orders")
sql_lines.append("  (id, user_id, address_id, voucher_id,")
sql_lines.append("   status, payment_method, payment_status, order_type,")
sql_lines.append("   subtotal, discount, shipping_fee, total,")
sql_lines.append("   note, created_at, paid_at, shipped_at, completed_at, cancelled_at)")
sql_lines.append("VALUES")
sql_lines.append(",\n".join(order_vals) + ";\n")

# ── INSERT order_items ─────────────────────────────────
sql_lines.append("-- ── INSERT order_items ───────────────────────────────")
sql_lines.append("INSERT INTO order_items")
sql_lines.append("  (id, order_id, product_id, variant_id, product_name, sku,")
sql_lines.append("   attributes_name, quantity, price, total, created_at)")
sql_lines.append("VALUES")
sql_lines.append(",\n".join(order_item_vals) + ";\n")

# Reset auto increment
sql_lines.append(f"ALTER TABLE orders AUTO_INCREMENT = {order_id};")
sql_lines.append(f"ALTER TABLE order_items AUTO_INCREMENT = {order_item_id};\n")
sql_lines.append("SET FOREIGN_KEY_CHECKS = 1;\n")
sql_lines.append(f"-- Done: {order_id - 1} orders, {order_item_id - 1} order_items inserted.")

# ── Write file ─────────────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"[OK] SQL -> {OUT_FILE}")
print(f"     Orders     : {order_id - 1}")
print(f"     OrderItems : {order_item_id - 1}")
print(f"\n[!] Import vao MySQL:")
print(f"    mysql -u root -p profile_service < seed_orders.sql")
