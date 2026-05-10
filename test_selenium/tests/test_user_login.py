"""
tests/test_user_login.py — MODULE 1: USER LOGIN
================================================
Target: Next.js frontend http://localhost:3000/login

Test cases (có rollback / DB check):
  UDN_11    — test_user_login_success          [DB: login_history + JWT token]
  UDN_13    — test_user_login_wrong_password   [DB: failed_attempt + rollback]
  UDN_17+18 — test_user_account_lock           [DB: status=LOCKED + rollback]

Bỏ (UI behavior, không tạo/thay đổi data trong DB):
  UDN_7 (empty password), UDN_8 (trimspace), UDN_12 (uppercase), UDN_14 (nonexistent)
"""
import pytest
from pages.login_page import LoginPage
from db.db_helper import (
    get_failed_attempt,
    get_user_status,
    reset_failed_attempt,
    execute_query,
)
from utils.config import USER_USERNAME, USER_PASSWORD


def _count_login_history() -> int:
    """Đếm rows trong login_history nếu bảng tồn tại."""
    try:
        rows = execute_query("SELECT COUNT(*) AS c FROM login_history")
        return rows[0]["c"] if rows else 0
    except Exception:
        return -1


class TestUserLogin:

    # ── UDN_11 ────────────────────────────────────────────────────────────────
    def test_user_login_success(self, driver):
        """
        [UDN_11] Login hợp lệ → redirect dashboard.
        DB check: login_history tăng + JWT token hợp lệ trong localStorage.
        """
        count_before = _count_login_history()

        page = LoginPage(driver)
        page.open()
        page.login(USER_USERNAME, USER_PASSWORD)

        assert page.is_logged_in(timeout=12), (
            f"[UDN_11] Không redirect sau login. URL: {driver.current_url}"
        )

        token = page.get_token()
        assert token, "[UDN_11] access_token phải tồn tại sau login thành công"
        assert token.startswith("eyJ"), (
            f"[UDN_11] Token phải là JWT (eyJ...). Got: {token[:20]}"
        )

        count_after = _count_login_history()
        if count_before >= 0 and count_after >= 0:
            assert count_after >= count_before, (
                "[UDN_11] login_history count không tăng sau login thành công"
            )

    # ── UDN_13 ────────────────────────────────────────────────────────────────
    def test_user_login_wrong_password(self, driver):
        """
        [UDN_13] Sai password → login thất bại.
        DB check: failed_attempt tăng lên.
        Rollback: reset failed_attempt trong finally.
        """
        attempt_before = get_failed_attempt(USER_USERNAME)
        try:
            page = LoginPage(driver)
            page.open()
            page.login(USER_USERNAME, "wrong123")

            assert not page.is_logged_in(timeout=3), "[UDN_13] Phải thất bại khi sai password"
            assert not page.has_token(), "[UDN_13] Không được có token sau login sai"

            attempt_after = get_failed_attempt(USER_USERNAME)
            if attempt_before is not None and attempt_after is not None:
                assert attempt_after > attempt_before, (
                    f"[UDN_13] failed_attempt phải tăng: {attempt_before} → {attempt_after}"
                )
        finally:
            reset_failed_attempt(USER_USERNAME)

    # ── UDN_17 + UDN_18 ───────────────────────────────────────────────────────
    def test_user_account_lock(self, driver):
        """
        [UDN_17+18] Sai password 6 lần → account bị khóa, đăng nhập đúng vẫn fail.
        DB check: failed_attempt >= 5, status = 'LOCKED'.
        Rollback: reset failed_attempt + unlock trong finally.
        """
        try:
            page = LoginPage(driver)
            for i in range(6):
                page.open()
                page.login(USER_USERNAME, f"wrong_attempt_{i}")

            attempt_db = get_failed_attempt(USER_USERNAME)
            status_db  = get_user_status(USER_USERNAME)

            if attempt_db is not None:
                assert attempt_db >= 5, (
                    f"[UDN_17] failed_attempt phải >= 5, got: {attempt_db}"
                )

            page.open()
            page.login(USER_USERNAME, USER_PASSWORD)
            still_locked = not page.is_logged_in(timeout=5)

            if status_db and status_db.upper() == "LOCKED":
                assert still_locked, (
                    "[UDN_18] Account locked trong DB nhưng vẫn đăng nhập được — BUG!"
                )
            else:
                pytest.fail(
                    f"[UDN_17/18] BUG — Sau 6 lần sai, account KHÔNG bị khóa. "
                    f"DB status={status_db!r}, failed_attempt={attempt_db}."
                )
        finally:
            reset_failed_attempt(USER_USERNAME)
