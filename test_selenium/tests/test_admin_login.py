"""
tests/test_admin_login.py — MODULE 4: ADMIN LOGIN
==================================================
Target: FE_Admin http://localhost:5500/login.html

Test cases:
  ADN_11 — test_admin_login_success
  ADN_13 — test_admin_login_wrong_password
"""
import pytest
from pages.admin_login_page import AdminLoginPage
from utils.config import ADMIN_USERNAME, ADMIN_PASSWORD


class TestAdminLogin:

    # ── ADN_11 ────────────────────────────────────────────────────────────────
    def test_admin_login_success(self, driver):
        """
        [ADN_11] Admin login với tài khoản hợp lệ → redirect admin dashboard.
        Input:    username=admin, password=admin (or a123456 per spec).
        Expected: URL chứa 'index.html', token trong localStorage.
        """
        page = AdminLoginPage(driver)
        page.open_fresh()
        page.login(ADMIN_USERNAME, ADMIN_PASSWORD)

        assert page.is_on_dashboard(timeout=10), (
            f"[ADN_11] Không redirect về dashboard sau admin login. "
            f"URL: {driver.current_url}"
        )

        token = page.get_token()
        assert token, "[ADN_11] Token phải tồn tại sau admin login thành công"

    # ── ADN_13 ────────────────────────────────────────────────────────────────
    def test_admin_login_wrong_password(self, driver):
        """
        [ADN_13] Sai password → login thất bại.
        Input:    username=admin, password=wrong123
        Expected: hiển thị "Sai tài khoản hoặc mật khẩu" (hoặc tương đương).
        """
        page = AdminLoginPage(driver)
        page.open_fresh()
        page.login(ADMIN_USERNAME, "wrong123")

        # Verify fail
        assert not page.is_on_dashboard(timeout=4), (
            "[ADN_13] Admin với password sai không được redirect về dashboard!"
        )
        assert page.is_on_login_page(), (
            "[ADN_13] Phải ở lại trang login sau sai password"
        )

        # Verify error message
        error = page.get_error_message(timeout=6)
        assert error, "[ADN_13] Phải hiển thị thông báo lỗi khi sai password"

        assert not page.has_token(), (
            "[ADN_13] Không được có token sau login sai password"
        )
