"""
pages/forgot_password_page.py — Page Object cho Forgot Password (MK module).

Architecture (ForgotPasswordDialog.tsx):
  - Không có trang riêng — đây là DIALOG mở từ trang /login.
  - Trigger button: button text = "Quên mật khẩu?"
  - Dialog input:   input[type='text'] placeholder="Tên đăng nhập"
  - Submit:         button[type='submit'] text="Gửi yêu cầu"
  - Loading:        5 giây artificial delay (await new Promise 5000ms)
  - Success:        state="success" → h3 "Gửi thành công!"
                    localStorage.setItem("mustChangePassword", username)
  - Error:          div.bg-red-50 hoặc h3.text-red-600 "Có lỗi xảy ra"
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_element, wait_for_clickable, element_exists
from utils.config import USER_LOGIN_URL, LONG_WAIT, DEFAULT_WAIT


class ForgotPasswordPage:
    """Page Object for the Forgot Password Dialog on /login page."""

    # ── Locators — trigger (on /login) ────────────────────────────────────────
    TRIGGER_BTN = (By.XPATH, "//button[contains(text(),'Quên mật khẩu')]")

    # ── Locators — inside dialog ───────────────────────────────────────────────
    # Plain input (not FloatingLabelInput)
    DIALOG_INPUT = (By.CSS_SELECTOR,
                    "div.fixed input[type='text'], "
                    "div[class*='fixed'] input[type='text']")
    DIALOG_INPUT_PLACEHOLDER = (By.CSS_SELECTOR, "input[placeholder='Tên đăng nhập']")

    DIALOG_SUBMIT = (By.XPATH, "//button[contains(text(),'Gửi yêu cầu')]")

    # Success: h3 contains "thành công"
    SUCCESS_HEADING = (By.XPATH, "//h3[contains(.,'thành công')]")
    SUCCESS_ALT     = (By.CSS_SELECTOR, "h3.text-green-600")

    # Error inside dialog
    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "div.bg-red-50"),
        (By.CSS_SELECTOR, "h3.text-red-600"),
        (By.XPATH, "//div[contains(@class,'fixed')]//div[contains(@class,'red')]"),
        (By.XPATH, "//div[contains(@class,'fixed')]//p[contains(@class,'red')]"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open_login_page(self):
        """Navigate to /login and wait for form."""
        self.driver.get(USER_LOGIN_URL)
        wait_for_element(
            self.driver,
            (By.CSS_SELECTOR, "input[name='username']"),
            timeout=12,
        )

    def open_dialog(self):
        """Click trigger button to open forgot password dialog."""
        btn = wait_for_clickable(self.driver, self.TRIGGER_BTN, timeout=8)
        btn.click()
        self._wait_for_dialog_input()

    def open(self):
        """Full flow: open /login then open dialog."""
        self.open_login_page()
        self.open_dialog()

    def _wait_for_dialog_input(self):
        """Wait until dialog input appears."""
        for loc in (self.DIALOG_INPUT, self.DIALOG_INPUT_PLACEHOLDER):
            try:
                WebDriverWait(self.driver, 6).until(
                    EC.presence_of_element_located(loc)
                )
                return
            except TimeoutException:
                continue

    # ── Actions ───────────────────────────────────────────────────────────────

    def _get_input(self):
        for loc in (self.DIALOG_INPUT, self.DIALOG_INPUT_PLACEHOLDER):
            try:
                return WebDriverWait(self.driver, 3).until(
                    EC.presence_of_element_located(loc)
                )
            except TimeoutException:
                continue
        return None

    def enter_username(self, value: str):
        el = self._get_input()
        if el:
            el.clear()
            el.send_keys(value)

    def click_submit(self):
        btn = wait_for_clickable(self.driver, self.DIALOG_SUBMIT, timeout=5)
        btn.click()

    def submit_with_enter(self):
        el = self._get_input()
        if el:
            el.send_keys(Keys.RETURN)

    def submit(self, username: str):
        """Enter username and click submit."""
        self.enter_username(username)
        self.click_submit()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=3) -> str:
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
        return ""

    def get_input_value(self) -> str:
        el = self._get_input()
        return el.get_attribute("value") if el else ""

    # ── State checks ──────────────────────────────────────────────────────────

    def is_success(self, timeout=LONG_WAIT) -> bool:
        """
        Wait for success state. Dialog has 5s artificial loading delay,
        so allow up to LONG_WAIT (default 20s).
        """
        for loc in (self.SUCCESS_HEADING, self.SUCCESS_ALT):
            try:
                WebDriverWait(self.driver, timeout).until(
                    EC.visibility_of_element_located(loc)
                )
                return True
            except TimeoutException:
                continue
        return False

    def is_error(self, timeout=8) -> bool:
        """True if error state is shown in dialog."""
        return bool(self.get_error_message(timeout=timeout))

    def dialog_is_open(self) -> bool:
        els = self.driver.find_elements(
            By.CSS_SELECTOR, "div.fixed.inset-0"
        )
        return len(els) > 0

    def get_must_change_password_flag(self) -> str | None:
        """Read localStorage flag set by dialog on success."""
        return self.driver.execute_script(
            "return localStorage.getItem('mustChangePassword');"
        )
