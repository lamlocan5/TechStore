"""
pages/profile_page.py — Page Object cho Update Profile (/profile → ProfileInfo).

Architecture (ProfileInfo.tsx):
  - URL:       http://localhost:3000/profile
  - Auth:      requires login (redirect to /login if not authenticated)
  - Flow:      click "Chỉnh sửa" button FIRST → fields become editable →
               fill fields → click "Lưu thay đổi"
  - Fields:    name="lastName", name="firstName", name="email",
               name="phone", name="dob"  (all via FloatingLabelInput)
  - Submit:    button text "Lưu thay đổi" (type="submit")
  - Cancel:    button text "Hủy"
  - Success:   react-hot-toast "Cập nhật thông tin thành công!"
  - Errors:    <p class="text-sm text-destructive"> under each field
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_element, wait_for_clickable
from utils.config import USER_PROFILE_URL


class ProfilePage:
    """Page Object for the user profile update page."""

    # ── Locators ──────────────────────────────────────────────────────────────
    EDIT_BTN   = (By.XPATH, "//button[contains(text(),'Chỉnh sửa')]")
    CANCEL_BTN = (By.XPATH, "//button[contains(text(),'Hủy')]")
    SUBMIT_BTN = (By.XPATH, "//button[contains(text(),'Lưu thay đổi')]")

    LAST_NAME_INPUT  = (By.CSS_SELECTOR, "input[name='lastName']")
    FIRST_NAME_INPUT = (By.CSS_SELECTOR, "input[name='firstName']")
    EMAIL_INPUT      = (By.CSS_SELECTOR, "input[name='email']")
    PHONE_INPUT      = (By.CSS_SELECTOR, "input[name='phone']")
    DOB_INPUT        = (By.CSS_SELECTOR, "input[name='dob']")

    # Inline validation errors
    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "p.text-sm.text-destructive"),
        (By.CSS_SELECTOR, "[class*='text-destructive']"),
        (By.CSS_SELECTOR, "p.text-red-600"),
    ]

    # Toast success (react-hot-toast)
    _SUCCESS_SELECTORS = [
        (By.XPATH, "//*[contains(text(),'Cập nhật thông tin thành công')]"),
        (By.XPATH, "//*[contains(text(),'thành công')]"),
        (By.CSS_SELECTOR, "[class*='success']"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open(self):
        """Navigate to profile page. Requires user to be logged in."""
        self.driver.get(USER_PROFILE_URL)
        # Wait for edit button to confirm page loaded and user is authenticated
        wait_for_element(self.driver, self.EDIT_BTN, timeout=15)

    # ── Actions ───────────────────────────────────────────────────────────────

    def click_edit(self):
        """Click 'Chỉnh sửa' to enter edit mode."""
        wait_for_clickable(self.driver, self.EDIT_BTN).click()
        # Wait for submit button to appear
        wait_for_element(self.driver, self.SUBMIT_BTN, timeout=5)

    def _fill(self, locator, value: str):
        """Clear and fill an input field. Pass empty string to clear."""
        el = wait_for_element(self.driver, locator)
        el.clear()
        if value:
            el.send_keys(value)

    def fill_first_name(self, value: str):
        self._fill(self.FIRST_NAME_INPUT, value)

    def fill_last_name(self, value: str):
        self._fill(self.LAST_NAME_INPUT, value)

    def fill_email(self, value: str):
        self._fill(self.EMAIL_INPUT, value)

    def fill_phone(self, value: str):
        self._fill(self.PHONE_INPUT, value)

    def fill_dob(self, value: str):
        """Fill date of birth (YYYY-MM-DD). Uses JS dispatch for date input."""
        el = wait_for_element(self.driver, self.DOB_INPUT)
        el.clear()
        self.driver.execute_script(
            "arguments[0].value = arguments[1]; "
            "arguments[0].dispatchEvent(new Event('change', {bubbles:true})); "
            "arguments[0].dispatchEvent(new Event('input',  {bubbles:true}));",
            el, value,
        )

    def click_submit(self):
        wait_for_clickable(self.driver, self.SUBMIT_BTN).click()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=5) -> str:
        """Return first visible validation/API error text."""
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

    # ── State checks ──────────────────────────────────────────────────────────

    def is_success(self, timeout=8) -> bool:
        """
        True when react-hot-toast success message appears.
        Uses fast polling (100ms) to catch short-lived toasts.
        """
        try:
            WebDriverWait(self.driver, timeout, poll_frequency=0.1).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(.,'thành công') and string-length(.) < 80]")
                )
            )
            return True
        except TimeoutException:
            pass
        return False

    def is_on_profile_page(self) -> bool:
        return "/profile" in self.driver.current_url

    def has_error(self, timeout=5) -> bool:
        return bool(self.get_error_message(timeout=timeout))
