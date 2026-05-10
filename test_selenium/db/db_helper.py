# db/db_helper.py — Database helper for test verification and cleanup
import pymysql
import pymysql.cursors
from utils.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


def _get_connection() -> pymysql.Connection:
    """Open a fresh autocommit connection."""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def execute_query(sql: str, params=None) -> list[dict]:
    """Execute a SELECT query and return list of row dicts."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return list(cur.fetchall())
    finally:
        conn.close()


def execute_update(sql: str, params=None) -> int:
    """Execute INSERT / UPDATE / DELETE. Returns affected row count."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.rowcount
    finally:
        conn.close()


def fetch_one(sql: str, params=None) -> dict | None:
    """Execute SELECT and return the first row, or None."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchone()
    finally:
        conn.close()


def fetch_all(sql: str, params=None) -> list[dict]:
    """Alias for execute_query."""
    return execute_query(sql, params)


# ── Domain helpers ─────────────────────────────────────────────────────────────

def get_user(username: str) -> dict | None:
    """Fetch user row from `user` table by username."""
    return fetch_one(
        "SELECT * FROM `user` WHERE username = %s", (username,)
    )


def user_exists(username: str) -> bool:
    return get_user(username) is not None


def delete_user(username: str) -> int:
    """Delete user and related rows. Returns deleted count."""
    row = get_user(username)
    if not row:
        return 0
    uid = row["id"]
    execute_update("DELETE FROM user_roles   WHERE user_id = %s", (uid,))
    execute_update("DELETE FROM user_profile WHERE user_id = %s", (uid,))
    execute_update("DELETE FROM `user`       WHERE id = %s",      (uid,))
    return 1


def reset_failed_attempt(username: str) -> int:
    """
    Reset failed login state.
    Schema note: user table has no failed_attempt column.
    Resets user_profile.status = 1 (active) as the closest equivalent.
    """
    row = get_user(username)
    if not row:
        return 0
    uid = row["id"]
    try:
        return execute_update(
            "UPDATE user_profile SET status = 1 WHERE user_id = %s", (uid,)
        )
    except Exception:
        return 0


def get_failed_attempt(username: str) -> int | None:
    """
    Return failed login attempt count.
    Schema note: user table has no failed_attempt column — always returns None.
    Tests that use this will skip the DB assertion gracefully.
    """
    return None


def get_user_status(username: str) -> str | None:
    """
    Return user status from user_profile.status (int: 1=active, 0=inactive/locked).
    Returns string 'ACTIVE' or 'LOCKED' for compatibility with existing test logic.
    """
    row = get_user(username)
    if not row:
        return None
    uid = row["id"]
    try:
        profile = fetch_one(
            "SELECT status FROM user_profile WHERE user_id = %s", (uid,)
        )
        if profile is not None:
            s = profile.get("status")
            if s == 1:
                return "ACTIVE"
            if s == 0:
                return "LOCKED"
    except Exception:
        pass
    return None


def create_test_user(username: str, password_hash: str = "$2a$10$testHashOnly") -> str:
    """
    Insert a minimal user + user_profile for test setup.
    Returns user id (UUID string).

    Schema:
      user:         id, username, password, rank (enum), total_spent (bigint)
      user_profile: id, user_id, status (int), first_name, last_name, email, phone, dob
    """
    import uuid
    uid = str(uuid.uuid4())
    profile_id = str(uuid.uuid4())
    execute_update(
        "INSERT INTO `user` (id, username, password, `rank`, total_spent) "
        "VALUES (%s, %s, %s, 'BRONZE', 0)",
        (uid, username, password_hash),
    )
    execute_update(
        "INSERT INTO user_profile "
        "(id, user_id, first_name, last_name, email, phone, status) "
        "VALUES (%s, %s, '', '', NULL, NULL, 1)",
        (profile_id, uid),
    )
    execute_update(
        "INSERT INTO user_roles (user_id, roles_name) VALUES (%s, 'USER')",
        (uid,),
    )
    return uid


# ── Profile helpers ────────────────────────────────────────────────────────────
#
# Schema: user_profile(id, user_id, first_name, last_name, email, phone, dob, status, avatar)
# fullname = last_name + " " + first_name  (Vietnamese convention)

def get_user_profile(username: str) -> dict | None:
    """Return the user_profile row for a given username."""
    row = get_user(username)
    if not row:
        return None
    return fetch_one(
        "SELECT * FROM user_profile WHERE user_id = %s", (row["id"],)
    )


def get_profile_names(username: str) -> tuple[str, str]:
    """
    Return (first_name, last_name) from user_profile.
    Used to save current values before a test so they can be restored in finally.
    """
    profile = get_user_profile(username)
    if not profile:
        return ("", "")
    return (profile.get("first_name") or "", profile.get("last_name") or "")


def restore_profile_names(username: str, first_name: str, last_name: str) -> int:
    """
    Restore first_name and last_name in user_profile (rollback for profile update test).
    """
    row = get_user(username)
    if not row:
        return 0
    return execute_update(
        "UPDATE user_profile SET first_name = %s, last_name = %s WHERE user_id = %s",
        (first_name, last_name, row["id"]),
    )


def get_fullname(username: str) -> str | None:
    """
    Return combined fullname from user_profile (last_name + ' ' + first_name).
    Vietnamese convention: họ (last_name) đứng trước tên (first_name).
    """
    profile = get_user_profile(username)
    if not profile:
        return None
    ln = profile.get("last_name") or ""
    fn = profile.get("first_name") or ""
    full = f"{ln} {fn}".strip()
    return full if full else None


def restore_fullname(username: str, fullname: str) -> int:
    """
    Restore fullname by splitting 'Họ Tên' → last_name=first_word, first_name=rest.
    For 'Nguyễn Văn A': last_name='Nguyễn', first_name='Văn A'.
    Prefer restore_profile_names() when you have first/last separately.
    """
    parts = fullname.strip().split(" ", 1)
    last_name = parts[0] if parts else ""
    first_name = parts[1] if len(parts) > 1 else ""
    return restore_profile_names(username, first_name, last_name)


def get_dob(username: str) -> str | None:
    """Return date-of-birth from user_profile.dob as string."""
    profile = get_user_profile(username)
    if not profile:
        return None
    dob = profile.get("dob")
    return str(dob) if dob is not None else None


# ── Password helpers ───────────────────────────────────────────────────────────

def get_password_hash(username: str) -> str | None:
    """Return raw password hash stored in DB."""
    row = get_user(username)
    if not row:
        return None
    return row.get("password")


def restore_password_hash(username: str, password_hash: str) -> int:
    """Directly overwrite password hash in DB (for rollback after change-password test)."""
    return execute_update(
        "UPDATE `user` SET password = %s WHERE username = %s",
        (password_hash, username),
    )


# ── Address helpers ────────────────────────────────────────────────────────────

def get_user_id(username: str) -> str | None:
    """Return user id for a given username."""
    row = get_user(username)
    return row["id"] if row else None


def get_address_by_phone(phone: str) -> dict | None:
    """Fetch address row by phone number."""
    return fetch_one("SELECT * FROM address WHERE phone = %s", (phone,))


def get_addresses_by_user(username: str) -> list[dict]:
    """Return all address rows for a user."""
    uid = get_user_id(username)
    if not uid:
        return []
    return fetch_all("SELECT * FROM address WHERE user_id = %s", (uid,))


def delete_address_by_phone(phone: str) -> int:
    """Delete address record(s) matching phone. Returns affected rows."""
    return execute_update("DELETE FROM address WHERE phone = %s", (phone,))


def delete_address_by_id(address_id) -> int:
    """Delete address record by primary key (id is INT)."""
    return execute_update("DELETE FROM address WHERE id = %s", (address_id,))


def get_default_address_count(username: str) -> int:
    """
    Count addresses with is_default=true for a user.
    is_default is BIT(1): use > 0 to handle both b'\x01' and 1.
    """
    uid = get_user_id(username)
    if not uid:
        return 0
    rows = fetch_all(
        "SELECT COUNT(*) AS cnt FROM address WHERE user_id = %s AND is_default > 0",
        (uid,),
    )
    return int(rows[0]["cnt"]) if rows else 0


def insert_test_address(
    username: str,
    phone: str,
    fullname: str = "Test User",
    city: str = "Ha Noi",
    district: str = "Hoai Duc",
    ward: str = "Dong La",
    detail: str = "Xom 6",
    is_default: int = 0,
) -> int | None:
    """
    Insert a test address row. Returns auto-generated int id or None on failure.

    Schema: address(id INT AUTO_INCREMENT, receiver_name, phone, province,
                    district, ward, address_line, is_default BIT(1), user_id)
    """
    uid = get_user_id(username)
    if not uid:
        return None
    try:
        execute_update(
            "INSERT INTO address "
            "(receiver_name, phone, province, district, ward, address_line, is_default, user_id) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (fullname, phone, city, district, ward, detail, is_default, uid),
        )
        row = fetch_one(
            "SELECT id FROM address WHERE phone = %s AND user_id = %s "
            "ORDER BY id DESC LIMIT 1",
            (phone, uid),
        )
        return row["id"] if row else None
    except Exception:
        return None


def address_exists_by_phone(phone: str) -> bool:
    """Check whether an address with given phone exists."""
    return get_address_by_phone(phone) is not None
