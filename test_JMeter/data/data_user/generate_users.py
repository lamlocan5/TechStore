# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

"""
Sinh 100 test users:
  - seed_users.sql   : INSERT vao bang User (identity) + user_profile (profile) + user_roles
  - users.csv        : username,password (plain text de dung trong JMeter)

Luu tai: C:/Users/Admin/Desktop/PTIT/Y4_T2/QA/SQA/test_JMeter/data/data_user/
"""

import os
import csv
import uuid
import bcrypt

# ── Config ──────────────────────────────────────
OUT_DIR     = r"C:\Users\Admin\Desktop\PTIT\Y4_T2\QA\SQA\test_JMeter\data\data_user"
NUM_USERS   = 100
PASSWORD    = "Test@123456"          # mat khau chung cho tat ca test users
ROLE_USER   = "USER"                 # PredefinedRole.USER_ROLE
NOW         = "2025-01-01 00:00:00"

FIRST_NAMES = [
    "Nguyen", "Tran", "Le", "Pham", "Hoang",
    "Vu", "Dang", "Bui", "Do", "Ngo",
    "Duong", "Ly", "Thai", "Cao", "Mai",
    "Dinh", "Ha", "Trinh", "Luu", "Vo",
]
LAST_NAMES = [
    "An", "Binh", "Chi", "Dung", "Em",
    "Giang", "Hoa", "Hung", "Khanh", "Lan",
    "Linh", "Long", "Minh", "Nam", "Oanh",
    "Phuong", "Quan", "Son", "Thu", "Tuan",
]


def bcrypt_hash(plain: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(plain.encode(), salt).decode()


def generate():
    os.makedirs(OUT_DIR, exist_ok=True)

    sql_lines   = []
    csv_rows    = []
    user_records = []   # list of (uid, username, hashed_pw, first, last, email, phone, profile_uid)

    print(f"[*] Generating BCrypt hashes for {NUM_USERS} users (rounds=10)...")
    print(f"    This may take ~30 seconds...")

    hashed_pw = bcrypt_hash(PASSWORD)
    print(f"    Hash sample: {hashed_pw[:29]}...")

    for i in range(1, NUM_USERS + 1):
        uid         = str(uuid.uuid4())
        profile_uid = str(uuid.uuid4())
        username    = f"testuser{i:03d}"
        first_name  = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
        last_name   = LAST_NAMES[(i - 1) % len(LAST_NAMES)]
        email       = f"testuser{i:03d}@jmeter.test"
        phone       = f"09{i:08d}"

        user_records.append((uid, username, hashed_pw, first_name, last_name, email, phone, profile_uid))
        csv_rows.append({"username": username, "password": PASSWORD})

    # ── SQL ──────────────────────────────────────
    sql_lines.append("-- =============================================")
    sql_lines.append("-- SEED DATA: 100 Test Users (JMeter)")
    sql_lines.append("-- Database: profile_service (identity + profile)")
    sql_lines.append("-- Password (plain): " + PASSWORD)
    sql_lines.append("-- =============================================\n")
    sql_lines.append("USE profile_service;\n")

    # Ensure ROLE USER exists
    sql_lines.append("-- Ensure USER role exists")
    sql_lines.append("INSERT IGNORE INTO role (name, description) VALUES ('USER', 'User role');\n")

    # ── INSERT User ──
    sql_lines.append("-- ── INSERT vao bang User (identity) ─────────────")
    user_vals = []
    for uid, username, pw, first, last, email, phone, _ in user_records:
        user_vals.append(
            f"  ('{uid}', '{username}', '{pw}', '{first}', '{last}', 0, 'BRONZE')"
        )
    sql_lines.append("INSERT IGNORE INTO user (id, username, password, first_name, last_name, total_spent, `rank`) VALUES")
    sql_lines.append(",\n".join(user_vals) + ";\n")

    # ── INSERT user_roles (join table) ──
    sql_lines.append("-- ── Gan role USER cho tung user ──────────────────")
    role_vals = []
    for uid, *_ in user_records:
        role_vals.append(f"  ('{uid}', '{ROLE_USER}')")
    sql_lines.append("INSERT IGNORE INTO user_roles (user_id, roles_name) VALUES")
    sql_lines.append(",\n".join(role_vals) + ";\n")

    # ── INSERT user_profile ──
    sql_lines.append("-- ── INSERT vao bang user_profile (profile-service) ─")
    profile_vals = []
    for uid, username, pw, first, last, email, phone, profile_uid in user_records:
        profile_vals.append(
            f"  ('{profile_uid}', '{uid}', '{first}', '{last}', '1995-01-01', "
            f"'{email}', '{phone}', NULL, 1)"
        )
    sql_lines.append("INSERT IGNORE INTO user_profile (id, user_id, first_name, last_name, dob, email, phone, avatar, status) VALUES")
    sql_lines.append(",\n".join(profile_vals) + ";\n")

    sql_lines.append("-- Done: 100 test users inserted.")

    # ── Write files ──
    sql_path = os.path.join(OUT_DIR, "seed_users.sql")
    csv_path = os.path.join(OUT_DIR, "users.csv")

    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"[OK] SQL -> {sql_path}")

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["username", "password"])
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"[OK] CSV -> {csv_path}")

    print(f"\n[!] Import vao MySQL:")
    print(f"    mysql -u root -p profile_service < seed_users.sql")
    print(f"\n[!] Dung trong JMeter CSV Data Set Config:")
    print(f"    Filename      : {csv_path}")
    print(f"    Variable Names: username,password")
    print(f"    Delimiter     : ,")


if __name__ == "__main__":
    generate()
