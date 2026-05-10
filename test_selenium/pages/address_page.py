"""
pages/address_page.py — Page Object cho Add / Edit / Delete Address.

Architecture:
  - URL:  http://localhost:3000/profile/addresses  (AddressList component)
  - Auth: requires login
  - Add/Edit form is in a shadcn <Dialog> (modal), NOT a separate page.

  Add button:  "Thêm địa chỉ mới" (or "Thêm địa chỉ đầu tiên" when empty)
  Dialog form fields:
    id="receiverName"   name="receiverName"  — người nhận
    id="phone"          name="phone"         — số điện thoại (regex: /^0[0-9]{9}$/)
    LocationSelect      — 3 Radix <SelectTrigger> buttons (NO name attributes):
                          placeholder "Tỉnh/Thành phố" → "Quận/Huyện" → "Phường/Xã"
                          district disabled until province selected
                          ward disabled until district selected
    id="addressLine"    name="addressLine"   — địa chỉ cụ thể
    id="isDefault"      type="checkbox"      — đặt làm mặc định

  Form submit:  "Lưu địa chỉ" (add) / "Cập nhật" (edit)
  Form cancel:  "Hủy"
  Success toast (sonner):  "Thêm địa chỉ thành công" / "Cập nhật địa chỉ thành công"

  Address card actions:
    Edit:        icon-only button (h-8 w-8 p-0) — no text, has <Edit> SVG
    Delete:      icon-only button with text-red-600 class — opens AlertDialog
    Set default: button "Đặt làm mặc định" (only shown when !address.isDefault)
  Delete confirm (AlertDialog): "Xóa" button (bg-red-600)

  Delete success toast (react-hot-toast): "Xóa địa chỉ thành công!"
  Set default toast:                      "Đã đặt làm địa chỉ mặc định!"
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from utils.waits import wait_for_element, wait_for_clickable
from utils.config import USER_ADDRESS_URL


class AddressPage:
    """Page Object for /profile/addresses (list + modal form)."""

    # ── List page ─────────────────────────────────────────────────────────────
    ADD_BTN = (By.XPATH,
        "//button[contains(text(),'Thêm địa chỉ mới') "
        "or contains(text(),'Thêm địa chỉ đầu tiên')]")

    # ── Dialog form fields ────────────────────────────────────────────────────
    DIALOG          = (By.CSS_SELECTOR, "[role='dialog']")
    RECEIVER_INPUT  = (By.CSS_SELECTOR, "input#receiverName, input[name='receiverName']")
    PHONE_INPUT     = (By.CSS_SELECTOR, "input#phone, input[name='phone']")
    ADDRESS_INPUT   = (By.CSS_SELECTOR, "input#addressLine, input[name='addressLine']")
    DEFAULT_CB      = (By.CSS_SELECTOR, "input#isDefault, input[name='isDefault']")

    # LocationSelect — Radix SelectTrigger buttons identified by placeholder text
    PROVINCE_TRIGGER = (By.XPATH,
        "//button[@role='combobox' and ("
        "contains(.,'Tỉnh/Thành phố') or contains(.,'Đang tải') "
        "or @aria-label='province')]")
    DISTRICT_TRIGGER = (By.XPATH,
        "//button[@role='combobox' and ("
        "contains(.,'Quận/Huyện') or contains(.,'Chọn tỉnh trước') or contains(.,'Đang tải') "
        "or @aria-label='district')]")
    WARD_TRIGGER     = (By.XPATH,
        "//button[@role='combobox' and ("
        "contains(.,'Phường/Xã') or contains(.,'Chọn quận trước') or contains(.,'Đang tải') "
        "or @aria-label='ward')]")

    # LocationSelect trigger by order (fallback — 1st, 2nd, 3rd combobox in dialog)
    _COMBOBOX_XPATH = "(//*[@role='dialog']//button[@role='combobox'])[{n}]"

    # Form submit buttons inside dialog
    SAVE_BTN   = (By.XPATH,
        "//*[@role='dialog']//button[contains(text(),'Lưu địa chỉ') "
        "or contains(text(),'Cập nhật')]")
    CANCEL_BTN = (By.XPATH,
        "//*[@role='dialog']//button[contains(text(),'Hủy')]")

    # Toast success patterns (sonner for address form, react-hot-toast for list actions)
    _SUCCESS_SELECTORS = [
        (By.XPATH, "//*[contains(text(),'thành công')]"),
        (By.XPATH, "//*[contains(text(),'Thêm địa chỉ thành công')]"),
        (By.XPATH, "//*[contains(text(),'Cập nhật địa chỉ thành công')]"),
        (By.XPATH, "//*[contains(text(),'Xóa địa chỉ thành công')]"),
        (By.XPATH, "//*[contains(text(),'Đã đặt làm địa chỉ mặc định')]"),
    ]

    _ERROR_SELECTORS = [
        (By.CSS_SELECTOR, "p.text-sm.text-destructive"),
        (By.CSS_SELECTOR, "p.text-sm.text-red-600"),
        (By.CSS_SELECTOR, "[class*='text-destructive']"),
    ]

    # Delete confirmation dialog
    CONFIRM_DELETE_BTN = (By.XPATH,
        "//button[contains(@class,'bg-red-600') and contains(text(),'Xóa')]")
    CANCEL_DELETE_BTN  = (By.XPATH,
        "//button[contains(text(),'Hủy') and not(@type='submit')]")

    def __init__(self, driver):
        self.driver = driver

    # ── Navigation ────────────────────────────────────────────────────────────

    def open_list(self):
        """Navigate to address list page and wait for data to fully load."""
        self.driver.get(USER_ADDRESS_URL)
        # Wait for add button to confirm page is rendered
        wait_for_element(self.driver, self.ADD_BTN, timeout=15)
        # Extra wait for React Query to finish fetching address data
        time.sleep(1.5)

    def refresh_list(self):
        """Hard reload the address list page (clears React Query cache)."""
        self.driver.get(USER_ADDRESS_URL)
        wait_for_element(self.driver, self.ADD_BTN, timeout=15)
        time.sleep(1.5)

    # ── Open form dialog ──────────────────────────────────────────────────────

    def click_add_new(self):
        """Click 'Thêm địa chỉ mới' to open add-address dialog."""
        wait_for_clickable(self.driver, self.ADD_BTN).click()
        wait_for_element(self.driver, self.DIALOG, timeout=8)
        wait_for_element(self.driver, self.RECEIVER_INPUT, timeout=8)

    # ── Fill form fields ──────────────────────────────────────────────────────

    def _fill(self, locator, value: str):
        el = wait_for_element(self.driver, locator, timeout=8)
        el.clear()
        if value:
            el.send_keys(value)

    def fill_receiver_name(self, value: str):
        self._fill(self.RECEIVER_INPUT, value)

    def fill_phone(self, value: str):
        self._fill(self.PHONE_INPUT, value)

    def fill_address_line(self, value: str):
        self._fill(self.ADDRESS_INPUT, value)

    def check_default(self, checked: bool = True):
        """
        Tick/untick the isDefault checkbox.
        Uses React-compatible native property setter so RHF picks up the state change.
        Plain el.click() via JS doesn't update RHF's internal state.
        """
        try:
            # Look inside the dialog specifically to avoid picking up stale elements
            try:
                el = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "[role='dialog'] input#isDefault")
                    )
                )
            except TimeoutException:
                el = wait_for_element(self.driver, self.DEFAULT_CB, timeout=5)

            self.driver.execute_script(
                "arguments[0].scrollIntoView({block:'center'});", el
            )
            time.sleep(0.3)

            # React-compatible setter: bypass React's tracking, then fire change event
            self.driver.execute_script("""
                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'checked'
                ).set;
                nativeInputValueSetter.call(arguments[0], arguments[1]);
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('input',  { bubbles: true }));
            """, el, checked)
            time.sleep(0.2)
        except TimeoutException:
            pass

    def _select_location(self, trigger_locator, fallback_xpath: str, value: str,
                          search_placeholder: str) -> bool:
        """
        Select a value from a Radix Select (LocationSelect component).
        Strategy:
          1. Click the SelectTrigger button
          2. Type in the search Input to filter
          3. Click the matching SelectItem
        """
        try:
            trigger = wait_for_clickable(self.driver, trigger_locator, timeout=8)
            trigger.click()
        except TimeoutException:
            # Try by order position
            try:
                trigger = wait_for_clickable(
                    self.driver, (By.XPATH, fallback_xpath), timeout=5
                )
                trigger.click()
            except TimeoutException:
                return False

        # Type in search box to filter results
        try:
            search_input = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located(
                    (By.XPATH,
                     f"//input[@placeholder='{search_placeholder}']")
                )
            )
            search_input.send_keys(value)
            time.sleep(0.3)  # allow filter to apply
        except TimeoutException:
            pass

        # Click matching option
        try:
            option = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable(
                    (By.XPATH,
                     f"//*[@role='option' and contains(.,'{value}')]")
                )
            )
            option.click()
            time.sleep(0.3)  # allow cascade to trigger
            return True
        except TimeoutException:
            return False

    def select_province(self, province_name: str) -> bool:
        """Select province from LocationSelect."""
        return self._select_location(
            self.PROVINCE_TRIGGER,
            self._COMBOBOX_XPATH.format(n=1),
            province_name,
            "Tìm tỉnh/thành...",
        )

    def select_district(self, district_name: str) -> bool:
        """Select district. Requires province to be selected first."""
        return self._select_location(
            self.DISTRICT_TRIGGER,
            self._COMBOBOX_XPATH.format(n=2),
            district_name,
            "Tìm quận/huyện...",
        )

    def select_ward(self, ward_name: str) -> bool:
        """Select ward. Requires district to be selected first."""
        return self._select_location(
            self.WARD_TRIGGER,
            self._COMBOBOX_XPATH.format(n=3),
            ward_name,
            "Tìm phường/xã...",
        )

    def click_submit(self):
        """Click 'Lưu địa chỉ' or 'Cập nhật' inside dialog."""
        wait_for_clickable(self.driver, self.SAVE_BTN).click()

    def fill_and_submit(
        self,
        receiver_name: str,
        phone: str,
        province: str,
        district: str,
        ward: str,
        address_line: str,
        set_default: bool = False,
    ):
        """Fill all address form fields and submit."""
        self.fill_receiver_name(receiver_name)
        self.fill_phone(phone)
        self.select_province(province)
        self.select_district(district)
        self.select_ward(ward)
        self.fill_address_line(address_line)
        if set_default:
            self.check_default(True)
        self.click_submit()

    # ── Address card actions ──────────────────────────────────────────────────

    def _wait_for_card(self, phone: str, timeout: int = 15):
        """
        Wait until the address card containing `phone` is visible in the list.
        The page uses React Query — card may take a moment to render after page load.
        Retries with a page reload if card not found initially.
        """
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//span[normalize-space(text())='{phone}']")
                )
            )
        except TimeoutException:
            # Force reload to clear React Query cache and re-fetch
            self.driver.refresh()
            wait_for_element(self.driver, self.ADD_BTN, timeout=15)
            time.sleep(1.5)
            # Try one more time
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//span[normalize-space(text())='{phone}']")
                )
            )

    def _find_card_element(self, phone: str):
        """
        Return the outermost card div containing the given phone number.
        Uses JavaScript to avoid brittle XPath class-matching.
        """
        # Find the span showing the phone text, then walk up to the card div
        span = self.driver.find_element(
            By.XPATH, f"//span[normalize-space(text())='{phone}']"
        )
        # Walk up DOM until we find a div with 'rounded-lg' class
        card = self.driver.execute_script("""
            var el = arguments[0];
            while (el && el.tagName !== 'BODY') {
                if (el.tagName === 'DIV' && el.className.includes('rounded-lg')) {
                    return el;
                }
                el = el.parentElement;
            }
            return null;
        """, span)
        return card

    def click_edit_button(self, phone: str):
        """Click the Edit icon button on the address card with given phone."""
        self._wait_for_card(phone)
        card = self._find_card_element(phone)
        if card is None:
            raise TimeoutException(f"Address card with phone '{phone}' not found")

        # Find the first icon-only button in the actions area (edit comes before delete)
        # Both edit and delete are <button> with no text (icon-only)
        # Edit is first; delete has text-red-600 class
        btn = self.driver.execute_script("""
            var card = arguments[0];
            var buttons = card.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                // Icon-only buttons: no visible text, and NOT the set-default button
                var text = b.innerText.trim();
                if (!text && !b.className.includes('text-red-600')) {
                    return b;
                }
            }
            return null;
        """, card)

        if btn is None:
            raise TimeoutException(f"Edit button not found in card for phone '{phone}'")
        WebDriverWait(self.driver, 3).until(EC.element_to_be_clickable(btn))
        btn.click()
        wait_for_element(self.driver, self.DIALOG, timeout=10)

    def click_delete_button(self, phone: str):
        """Click the Delete (trash) icon button on the address card with given phone."""
        self._wait_for_card(phone)
        card = self._find_card_element(phone)
        if card is None:
            raise TimeoutException(f"Address card with phone '{phone}' not found")

        btn = self.driver.execute_script("""
            var card = arguments[0];
            var buttons = card.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                if (b.className.includes('text-red-600')) {
                    return b;
                }
            }
            return null;
        """, card)

        if btn is None:
            raise TimeoutException(f"Delete button not found in card for phone '{phone}'")
        WebDriverWait(self.driver, 3).until(EC.element_to_be_clickable(btn))
        btn.click()

    def confirm_delete(self):
        """Click 'Xóa' in the AlertDialog confirmation."""
        # AlertDialogAction renders as <button> with bg-red-600 and text "Xóa"
        try:
            btn = WebDriverWait(self.driver, 8).until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//button[normalize-space(text())='Xóa']")
                )
            )
            btn.click()
        except TimeoutException:
            # Fallback: try any button with Xóa text
            try:
                btn = WebDriverWait(self.driver, 3).until(
                    EC.element_to_be_clickable(
                        (By.XPATH, "//button[contains(text(),'Xóa')]")
                    )
                )
                btn.click()
            except TimeoutException:
                pass

    def click_set_default_button(self, phone: str):
        """Click 'Đặt làm mặc định' on the address card with given phone."""
        self._wait_for_card(phone)
        card = self._find_card_element(phone)
        if card is None:
            raise TimeoutException(f"Address card with phone '{phone}' not found")

        btn = self.driver.execute_script("""
            var card = arguments[0];
            var buttons = card.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].innerText.includes('Đặt làm mặc định')) {
                    return buttons[i];
                }
            }
            return null;
        """, card)

        if btn is None:
            raise TimeoutException(
                f"'Đặt làm mặc định' button not found in card for phone '{phone}'"
            )
        WebDriverWait(self.driver, 3).until(EC.element_to_be_clickable(btn))
        btn.click()

    # ── State / getters ───────────────────────────────────────────────────────

    def address_card_visible(self, phone: str, timeout=5) -> bool:
        """True if address card with given phone is visible in the list."""
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//*[contains(text(),'{phone}')]")
                )
            )
            return True
        except TimeoutException:
            return False

    def is_district_disabled(self) -> bool:
        """True if district trigger shows 'Chọn tỉnh trước' (i.e. no province selected)."""
        try:
            el = WebDriverWait(self.driver, 3).until(
                EC.presence_of_element_located(self.DISTRICT_TRIGGER)
            )
            return "Chọn tỉnh trước" in el.text or el.get_attribute("disabled") == "true"
        except TimeoutException:
            return False

    def get_error_message(self, timeout=5) -> str:
        """Return first visible validation error text inside the dialog."""
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

    def is_success(self, timeout=8) -> bool:
        """
        True when any success toast appears.
        Uses fast polling to catch short-lived toasts.
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
        return False

    def dialog_is_open(self) -> bool:
        """True if the address form dialog is currently open."""
        try:
            WebDriverWait(self.driver, 2).until(
                EC.presence_of_element_located(self.DIALOG)
            )
            return True
        except TimeoutException:
            return False

    def wait_for_list_reload(self, timeout=5):
        """Wait briefly for the address list to reload after an action."""
        time.sleep(1)
