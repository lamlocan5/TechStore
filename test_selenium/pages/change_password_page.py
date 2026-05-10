"""
pages/change_password_page.py — Page Object cho Change Password.

Architecture (ChangePasswordForm.tsx at /profile/change-password):
  - URL:    http://localhost:3000/profile/change-password
  - Auth:   requires login
  - Fields:
      id="currentPassword"  name="currentPassword"
      id="newPassword"      name="newPassword"
      id="confirmPassword"  name="confirmPassword"
  - Submit:  button text "Đổi mật khẩu" (type="submit")
  - Success: sonner toast "Đổi mật khẩu thành công!"
  - Inline errors: <p class="text-sm text-destructive">
  - Error messages (zod validation):
      - confirm mismatch: "Mật khẩu xác nhận không khớp"
      - same as old:      "Mật khẩu mới phải khác mật khẩu hiện tại"
  - API error (wrong current): "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại."
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_element, wait_for_clickable
from utils.config import USER_CHANGE_PW_URL


class ChangePasswordPage:
    """Page Object for the change password page."""

    # ── Locators ──────────────────────────────────────────────────────────────
    CURRENT_PW_INPUT = (By.CSS_SELECTOR, "input#currentPassword, input[name='currentPassword']")
    NEW_PW_INPUT     = (By.CSS_SELECTOR, "input#newPassword,     input[name='newPassword']")
    CONFIRM_PW_INPUT = (By.CSS_SELECTOR, "input#confirmPassword, input[name='confirmPassword']")
    SUBMIT_BTN       = (By.XPATH, "//button[contains(text(),'Đổi mật khẩu')]")

    # Inline errors — only <p> tags to avoid picking up asterisks from <label> spans
    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "p.text-sm.text-destructive"),
        (By.CSS_SELECTOR, "p.text-red-600"),
    ]

    # Sonner error toast selectors (API errors shown via toast.error)
    _SONNER_ERROR_SELECTORS = [
        (By.XPATH, "//*[@data-sonner-toast]"),
        (By.CSS_SELECTOR, "[data-sonner-toast]"),
    ]

    # Toast success (sonner) — use broad text search with fast polling
    _SUCCESS_TEXT = "thành công"
    _SUCCESS_SELECTORS = [
        (By.XPATH, "//*[contains(.,'Đổi mật khẩu thành công')]"),
        (By.XPATH, "//*[@data-title and contains(.,'thành công')]"),
        (By.XPATH, "//*[@data-sonner-toast and contains(.,'thành công')]"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open(self):
        """Navigate to change-password page. Requires user to be logged in."""
        self.driver.get(USER_CHANGE_PW_URL)
        wait_for_element(self.driver, self.SUBMIT_BTN, timeout=15)

    # ── Fill helpers ──────────────────────────────────────────────────────────

    def _fill(self, locator, value: str):
        el = wait_for_element(self.driver, locator)
        el.clear()
        if value:
            el.send_keys(value)

    def fill_current_password(self, value: str):
        self._fill(self.CURRENT_PW_INPUT, value)

    def fill_new_password(self, value: str):
        self._fill(self.NEW_PW_INPUT, value)

    def fill_confirm_password(self, value: str):
        self._fill(self.CONFIRM_PW_INPUT, value)

    def click_submit(self):
        wait_for_clickable(self.driver, self.SUBMIT_BTN).click()

    def fill_and_submit(
        self,
        current_password: str,
        new_password: str,
        confirm_password: str = "",
    ):
        """Fill all fields and click submit. confirm defaults to new_password."""
        self.fill_current_password(current_password)
        self.fill_new_password(new_password)
        self.fill_confirm_password(confirm_password or new_password)
        self.click_submit()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=6) -> str:
        """
        Return first meaningful error text.
        Priority:
          1. Inline <p class="text-sm text-destructive"> zod validation errors
          2. Sonner error toast (API errors like wrong current password)
        Excludes asterisk (*) from required-field label spans.
        """
        import time as _time
        deadline = _time.time() + timeout

        while _time.time() < deadline:
            # 1. Inline zod validation errors (only <p> elements, not <span> labels)
            for loc in self._ERROR_SELECTORS:
                try:
                    els = self.driver.find_elements(*loc)
                    for el in els:
                        txt = el.text.strip()
                        if txt and txt != "*" and len(txt) > 3:
                            return txt
                except Exception:
                    pass

            # 2. Sonner toast (API error response)
            # Sonner renders <li data-sonner-toast data-type="error"> with text inside
            # Also catch react-hot-toast which renders with similar patterns
            try:
                # Look for any toast element — sonner attributes may vary by version
                toast_candidates = self.driver.find_elements(
                    By.XPATH,
                    "//*[contains(.,'Không thể') or contains(.,'không đúng') "
                    "or contains(.,'kiểm tra lại') or contains(.,'hiện tại không')]"
                )
                for el in toast_candidates:
                    tag = el.tag_name.lower()
                    if tag in ("body", "html", "main", "section", "header", "form"):
                        continue
                    txt = el.text.strip()
                    # Must be a meaningful message, not just a heading
                    if txt and len(txt) > 10 and len(txt) < 300 and txt != "*":
                        # Exclude page headings like "Đổi mật khẩu"
                        if "đổi mật khẩu" == txt.lower():
                            continue
                        return txt
            except Exception:
                pass

            _time.sleep(0.2)

        return ""

    def get_all_errors(self, timeout=3) -> list[str]:
        errors = []
        for loc in self._ERROR_SELECTORS[:2]:
            try:
                els = self.driver.find_elements(*loc)
                errors.extend(e.text.strip() for e in els if e.text.strip())
            except Exception:
                pass
        return list(dict.fromkeys(errors))

    # ── State checks ──────────────────────────────────────────────────────────

    def is_success(self, timeout=8) -> bool:
        """
        True when sonner success toast appears.
        Uses fast polling (100ms) to catch short-lived toasts.
        """
        try:
            WebDriverWait(self.driver, timeout, poll_frequency=0.1).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(.,'thành công') and string-length(.) < 100]")
                )
            )
            return True
        except TimeoutException:
            pass
        # Fallback: check each selector
        for loc in self._SUCCESS_SELECTORS:
            try:
                WebDriverWait(self.driver, 1, poll_frequency=0.1).until(
                    EC.presence_of_element_located(loc)
                )
                return True
            except TimeoutException:
                continue
        return False

    def has_error(self, timeout=5) -> bool:
        return bool(self.get_error_message(timeout=timeout))
