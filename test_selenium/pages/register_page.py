"""
pages/register_page.py — Page Object cho Register (Next.js /register).

Architecture (RegisterForm.tsx):
  - URL:     http://localhost:3000/register
  - Fields:  input[name='lastName'], input[name='firstName'], input[name='username'],
             input[name='email'], input[name='phone'], input[name='dob'],
             input[name='password'], input[name='confirmPassword']
  - Submit:  button[type='submit']
  - Errors:  <p class="text-sm text-red-600"> (zod inline per field)
             OR top-level FormErrorMessage (API error)
  - Success: router.push("/login")
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.waits import wait_for_element, wait_for_clickable, wait_for_url_contains
from utils.config import USER_REGISTER_URL, DEFAULT_WAIT


class RegisterPage:
    """Page Object for the user registration page (Next.js)."""

    # ── Locators ──────────────────────────────────────────────────────────────
    LAST_NAME_INPUT      = (By.CSS_SELECTOR, "input[name='lastName']")
    FIRST_NAME_INPUT     = (By.CSS_SELECTOR, "input[name='firstName']")
    USERNAME_INPUT       = (By.CSS_SELECTOR, "input[name='username']")
    EMAIL_INPUT          = (By.CSS_SELECTOR, "input[name='email']")
    PHONE_INPUT          = (By.CSS_SELECTOR, "input[name='phone']")
    DOB_INPUT            = (By.CSS_SELECTOR, "input[name='dob']")
    PASSWORD_INPUT       = (By.CSS_SELECTOR, "input[name='password']")
    CONFIRM_PW_INPUT     = (By.CSS_SELECTOR, "input[name='confirmPassword']")
    SUBMIT_BTN           = (By.CSS_SELECTOR, "button[type='submit']")

    # Error selectors
    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "p.text-red-600"),
        (By.CSS_SELECTOR, "p.text-sm.text-red-600"),
        (By.CSS_SELECTOR, ".bg-red-50"),
        (By.CSS_SELECTOR, "[class*='text-red-6']"),
    ]

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open(self):
        self.driver.get(USER_REGISTER_URL)
        wait_for_element(self.driver, self.USERNAME_INPUT, timeout=12)

    # ── Fill helpers ──────────────────────────────────────────────────────────

    def _fill(self, locator, value: str):
        """Find field and send keys (skips empty value)."""
        el = wait_for_element(self.driver, locator)
        el.clear()
        if value:
            el.send_keys(value)

    def fill_last_name(self, v):    self._fill(self.LAST_NAME_INPUT, v)
    def fill_first_name(self, v):   self._fill(self.FIRST_NAME_INPUT, v)
    def fill_username(self, v):     self._fill(self.USERNAME_INPUT, v)
    def fill_email(self, v):        self._fill(self.EMAIL_INPUT, v)
    def fill_phone(self, v):        self._fill(self.PHONE_INPUT, v)
    def fill_password(self, v):     self._fill(self.PASSWORD_INPUT, v)
    def fill_confirm_password(self, v): self._fill(self.CONFIRM_PW_INPUT, v)

    def fill_dob(self, value: str):
        """Fill date-of-birth. Next.js uses input[type='date'] — value must be YYYY-MM-DD.
        Uses React's nativeInputValueSetter to properly trigger React hook form state.
        """
        el = wait_for_element(self.driver, self.DOB_INPUT)
        # React hook form ignores plain JS value assignment.
        # Must use nativeInputValueSetter to trigger React's synthetic onChange.
        self.driver.execute_script("""
            var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeInputValueSetter.call(arguments[0], arguments[1]);
            arguments[0].dispatchEvent(new Event('input',  {bubbles: true}));
            arguments[0].dispatchEvent(new Event('change', {bubbles: true}));
        """, el, value)

    def fill_full_form(
        self,
        last_name="Nguyen",
        first_name="Van A",
        username="selenium_test_01",
        email="selenium_test_01@gmail.com",
        phone="0123456789",
        dob="2000-02-02",       # YYYY-MM-DD for HTML date input
        password="a123456",
        confirm_password="a123456",
    ):
        """Fill all fields with provided values."""
        self.fill_last_name(last_name)
        self.fill_first_name(first_name)
        self.fill_username(username)
        self.fill_email(email)
        self.fill_phone(phone)
        self.fill_dob(dob)
        self.fill_password(password)
        self.fill_confirm_password(confirm_password)

    def click_submit(self):
        wait_for_clickable(self.driver, self.SUBMIT_BTN).click()

    def register(self, **kwargs):
        """Fill form and submit."""
        self.fill_full_form(**kwargs)
        self.click_submit()

    # ── Getters ───────────────────────────────────────────────────────────────

    def get_error_message(self, timeout=5) -> str:
        """Return first visible error message."""
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

    def get_all_errors(self, timeout=3) -> list[str]:
        """Return all visible error messages."""
        errors = []
        for loc in self._ERROR_SELECTORS[:2]:
            try:
                els = self.driver.find_elements(*loc)
                errors.extend(e.text.strip() for e in els if e.text.strip())
            except Exception:
                pass
        return list(dict.fromkeys(errors))  # deduplicate preserving order

    # ── State checks ──────────────────────────────────────────────────────────

    def is_redirected_to_login(self, timeout=10) -> bool:
        """True when redirect to /login happens after successful registration."""
        return wait_for_url_contains(self.driver, "/login", timeout=timeout)

    def is_on_register_page(self) -> bool:
        return "/register" in self.driver.current_url

    def has_error(self, timeout=5) -> bool:
        return bool(self.get_error_message(timeout=timeout))
