"""
pages/admin_login_page.py — Page Object cho Admin Login (FE_Admin).

Architecture (FE_Admin/login.html):
  - URL:      http://localhost:5500/login.html
  - Inputs:   id='username', id='password'
  - Login:    id='btnLogin'
  - Dashboard: http://localhost:5500/index.html
  - Token:    localStorage['adminToken']
  - Errors:   alert/toast or inline element with class alert-danger
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_element, wait_for_clickable, wait_for_url_contains
from utils.config import ADMIN_LOGIN_URL, ADMIN_DASHBOARD_URL, DEFAULT_WAIT


class AdminLoginPage:
    """Page Object for the Admin login page (FE_Admin static HTML)."""

    # ── Locators ──────────────────────────────────────────────────────────────
    USERNAME_INPUT = (By.ID, "username")
    PASSWORD_INPUT = (By.ID, "password")
    LOGIN_BTN      = (By.ID, "btnLogin")

    _ERROR_SELECTORS = [
        (By.ID, "alert"),
        (By.CLASS_NAME, "alert-danger"),
        (By.CSS_SELECTOR, ".alert.alert-danger"),
        (By.CSS_SELECTOR, ".toast-error"),
        (By.CSS_SELECTOR, "[class*='error']"),
        (By.CSS_SELECTOR, ".text-danger"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open(self):
        self.driver.get(ADMIN_LOGIN_URL)
        wait_for_element(self.driver, self.USERNAME_INPUT, timeout=10)

    def clear_session(self):
        try:
            self.driver.execute_script(
                "localStorage.clear(); sessionStorage.clear();"
            )
        except Exception:
            pass

    def open_fresh(self):
        self.open()
        self.clear_session()

    # ── Actions ───────────────────────────────────────────────────────────────

    def enter_username(self, value: str):
        el = wait_for_element(self.driver, self.USERNAME_INPUT)
        el.clear()
        el.send_keys(value)

    def enter_password(self, value: str):
        el = wait_for_element(self.driver, self.PASSWORD_INPUT)
        el.clear()
        el.send_keys(value)

    def click_login(self):
        wait_for_clickable(self.driver, self.LOGIN_BTN).click()

    def login(self, username: str, password: str):
        """Full login: enter credentials and click login."""
        self.enter_username(username)
        self.enter_password(password)
        self.click_login()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=5) -> str:
        """Return first visible error text."""
        for loc in self._ERROR_SELECTORS:
            try:
                el = WebDriverWait(self.driver, timeout).until(
                    EC.visibility_of_element_located(loc)
                )
                txt = el.text.strip()
                if txt:
                    return txt
            except TimeoutException:
                continue
        # Fallback: scan entire page source for known Vietnamese error phrases
        src = self.driver.page_source.lower()
        if any(kw in src for kw in ["sai", "không đúng", "thất bại", "invalid"]):
            return "(error detected in page source)"
        return ""

    def get_token(self) -> str | None:
        """Return admin token from localStorage."""
        for key in ("adminToken", "token", "accessToken", "access_token"):
            val = self.driver.execute_script(
                f"return localStorage.getItem('{key}');"
            )
            if val:
                return val
        return None

    # ── State checks ──────────────────────────────────────────────────────────

    def is_on_dashboard(self, timeout=10) -> bool:
        """True when redirected to admin dashboard (index.html)."""
        return wait_for_url_contains(self.driver, "index.html", timeout=timeout)

    def is_on_login_page(self) -> bool:
        return "login" in self.driver.current_url.lower()

    def has_token(self) -> bool:
        return bool(self.get_token())

    def has_error(self, timeout=5) -> bool:
        return bool(self.get_error_message(timeout=timeout))
