"""
tests/test_logout.py — MODULE 3: LOGOUT
========================================
Target: http://localhost:3000  (requires login)

Test cases:
  DX_2 — test_logout_success
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_clickable
from utils.config import USER_BASE_URL, USER_LOGIN_URL, DEFAULT_WAIT


# ── Logout page helper (inline, no separate page object needed) ───────────────

_LOGOUT_BTN_LOCATORS = [
    (By.XPATH, "//button[contains(text(),'Đăng xuất') or contains(text(),'Logout')]"),
    (By.CSS_SELECTOR, "button[data-action='logout']"),
    (By.XPATH, "//a[contains(text(),'Đăng xuất') or contains(text(),'Logout')]"),
    (By.CSS_SELECTOR, "[class*='logout']"),
]


def _click_logout(driver):
    """Find and click the logout button/link."""
    for loc in _LOGOUT_BTN_LOCATORS:
        try:
            btn = WebDriverWait(driver, 5).until(EC.element_to_be_clickable(loc))
            btn.click()
            return True
        except TimeoutException:
            continue

    # Fallback: look for user avatar/menu then logout inside it
    avatar_locs = [
        (By.CSS_SELECTOR, "[class*='avatar'], [class*='user-menu'], [class*='dropdown']"),
        (By.XPATH, "//button[contains(@class,'profile') or contains(@class,'user')]"),
    ]
    for loc in avatar_locs:
        try:
            WebDriverWait(driver, 4).until(EC.element_to_be_clickable(loc)).click()
            # After expanding menu, try logout again
            for logout_loc in _LOGOUT_BTN_LOCATORS:
                try:
                    btn = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable(logout_loc)
                    )
                    btn.click()
                    return True
                except TimeoutException:
                    continue
        except TimeoutException:
            continue

    return False


class TestLogout:

    # ── DX_2 ──────────────────────────────────────────────────────────────────
    def test_logout_success(self, logged_in_driver):
        """
        [DX_2] Đăng xuất thành công → redirect về trang login, token bị xóa.
        Expected:
          - Redirect về /login
          - access_token không còn trong localStorage
          - Truy cập trang cần auth sẽ bị redirect về /login
        Cleanup: không cần (không tạo dữ liệu).
        """
        driver = logged_in_driver

        # Logout button is in ProfileSidebar — navigate to /profile first
        from utils.config import USER_PROFILE_URL
        driver.get(USER_PROFILE_URL)
        # Wait for sidebar to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located(
                (By.XPATH, "//button[contains(text(),'Đăng xuất')]")
            )
        )

        # Attempt logout
        clicked = _click_logout(driver)
        assert clicked, (
            "[DX_2] Không tìm thấy nút Đăng xuất. "
            "Kiểm tra lại selector trong _LOGOUT_BTN_LOCATORS."
        )

        # Verify redirect to /login
        try:
            WebDriverWait(driver, 10).until(EC.url_contains("/login"))
            redirected = True
        except TimeoutException:
            redirected = False

        assert redirected, (
            f"[DX_2] Phải redirect về /login sau logout. URL: {driver.current_url}"
        )

        # Verify token removed from localStorage
        token = driver.execute_script("return localStorage.getItem('access_token');")
        assert not token, (
            "[DX_2] access_token phải bị xóa khỏi localStorage sau logout"
        )

        # Verify: accessing protected page redirects back to /login
        driver.get(USER_BASE_URL + "/profile")
        try:
            WebDriverWait(driver, 8).until(EC.url_contains("/login"))
            session_invalid = True
        except TimeoutException:
            session_invalid = False

        assert session_invalid, (
            "[DX_2] Sau logout, truy cập trang /profile phải redirect về /login (session invalid)"
        )
