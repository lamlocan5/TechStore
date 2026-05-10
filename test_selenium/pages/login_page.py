"""
pages/login_page.py — Page Object cho User Login (Next.js /login).

Architecture (LoginForm.tsx):
  - URL:      http://localhost:3000/login
  - Inputs:   FloatingLabelInput → input[name='username'], input[name='password']
  - Submit:   button[type='submit']
  - FE error: <p class="text-sm text-red-600"> (zod inline)
  - API error: div.bg-red-50 or similar FormErrorMessage
  - Token:    localStorage['access_token']
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from utils.waits import (
    wait_for_element, wait_for_clickable, wait_for_visible,
    wait_for_url_contains, element_exists,
)
from utils.config import USER_LOGIN_URL, DEFAULT_WAIT
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class LoginPage:
    """Page Object for the user-facing login page (Next.js)."""

    # ── Locators ──────────────────────────────────────────────────────────────
    USERNAME_INPUT = (By.CSS_SELECTOR, "input[name='username']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='password']")
    SUBMIT_BTN     = (By.CSS_SELECTOR, "button[type='submit']")

    # Error message selectors (zod inline + API error)
    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "p.text-red-600"),
        (By.CSS_SELECTOR, ".bg-red-50"),
        (By.CSS_SELECTOR, "p.text-sm.text-red-600"),
        (By.CSS_SELECTOR, "[class*='text-red-6']"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open(self):
        """Navigate to login page and wait for form."""
        self.driver.get(USER_LOGIN_URL)
        wait_for_element(self.driver, self.USERNAME_INPUT, timeout=12)

    def clear_session(self):
        """Clear localStorage/sessionStorage before test."""
        try:
            self.driver.execute_script(
                "localStorage.clear(); sessionStorage.clear();"
            )
        except Exception:
            pass

    def open_fresh(self):
        """Clear session then open login page."""
        self.open()
        self.clear_session()
        self.driver.refresh()
        wait_for_element(self.driver, self.USERNAME_INPUT, timeout=12)

    # ── Actions ───────────────────────────────────────────────────────────────

    def enter_username(self, value: str):
        el = wait_for_element(self.driver, self.USERNAME_INPUT)
        el.clear()
        el.send_keys(value)

    def enter_password(self, value: str):
        el = wait_for_element(self.driver, self.PASSWORD_INPUT)
        el.clear()
        el.send_keys(value)

    def click_submit(self):
        wait_for_clickable(self.driver, self.SUBMIT_BTN).click()

    def submit_with_enter(self):
        wait_for_element(self.driver, self.PASSWORD_INPUT).send_keys(Keys.RETURN)

    def login(self, username: str, password: str):
        """Full login flow: enter credentials and click submit."""
        self.enter_username(username)
        self.enter_password(password)
        self.click_submit()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=5) -> str:
        """Return first visible error message text."""
        for loc in self._ERROR_SELECTORS:
            try:
                els = WebDriverWait(self.driver, timeout).until(
                    EC.presence_of_all_elements_located(loc)
                )
                for el in els:
                    txt = el.text.strip()
                    if txt:
                        return txt
            except TimeoutException:
                continue
        return ""

    def get_token(self) -> str | None:
        """Return access_token from localStorage."""
        val = self.driver.execute_script(
            "return localStorage.getItem('access_token');"
        )
        return val if val else None

    # ── State checks ──────────────────────────────────────────────────────────

    def is_on_login_page(self) -> bool:
        return "/login" in self.driver.current_url

    def is_logged_in(self, timeout=10) -> bool:
        """True when URL no longer contains /login (redirected to dashboard)."""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: "/login" not in d.current_url
            )
            return True
        except TimeoutException:
            return False

    def has_token(self) -> bool:
        return bool(self.get_token())

    def has_error(self, timeout=5) -> bool:
        return bool(self.get_error_message(timeout=timeout))
