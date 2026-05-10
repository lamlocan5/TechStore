"""
tests/test_register.py — MODULE 2: REGISTER
============================================
Target: Next.js frontend http://localhost:3000/register

Test cases (có rollback / DB check):
  DK_7   — test_register_success              [DB check + rollback]
  DK_8   — test_register_duplicate_username   [DB check + rollback]
  DK_10  — test_register_last_name_numbers    [DB check]        [BUG confirmed]
  DK_11  — test_register_last_name_special    [DB check]        [BUG confirmed]
  DK_13  — test_register_first_name_numbers   [DB check]        [BUG confirmed]
  DK_14  — test_register_first_name_special   [DB check]        [BUG confirmed]
  DK_16  — test_register_username_special     [DB check]        [System Test SAI — app OK]
  DK_17  — test_register_empty_email          [DB check+rollback][BUG confirmed]
  DK_18  — test_register_duplicate_email      [DB check+rollback][System Test SAI — DB constraint + error OK]
  DK_19  — test_register_invalid_email        [DB check+rollback][BUG confirmed — backend không validate]
  DK_20  — test_register_empty_phone          [DB check+rollback][BUG confirmed]
  DK_21  — test_register_duplicate_phone      [DB check+rollback][cần xác nhận]
  DK_27  — test_register_future_dob           [DB check+rollback][BUG confirmed]
  DK_32+33 — test_register_weak_password      [DB check+rollback][BUG confirmed]

Bỏ (pure UI validation, không tạo data, không cần rollback):
  DK_9, DK_12, DK_15, DK_22, DK_23, DK_24, DK_25, DK_26, DK_28, DK_29, DK_30, DK_31
"""
import pytest
from pages.register_page import RegisterPage
from db.db_helper import (
    user_exists, delete_user, create_test_user, get_user, execute_update, execute_query,
)
from utils.config import USER_USERNAME, USER_PASSWORD

# ── Test constants ─────────────────────────────────────────────────────────────
TEST_USERNAME  = "selenium_reg_01"
DUP_USERNAME   = "dup_user_sel"
DUP_EMAIL_USER = "dup_email_sel"
DUP_PHONE_USER = "dup_phone_sel"
DUP_EMAIL      = "dup_email_test@gmail.com"
DUP_PHONE      = "0911222333"

# ── Base form data (all valid, unique — không trùng user nào trong DB) ─────────
BASE = dict(
    last_name="Nguyen", first_name="Van A",
    email="selenium_autotest@testmail.com", phone="0999000111",
    dob="2000-02-02", password="a123456", confirm_password="a123456",
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _setup_user_with_email(username: str, email: str) -> None:
    """Tạo test user rồi set email cụ thể trong user_profile."""
    delete_user(username)
    create_test_user(username)
    row = get_user(username)
    if row:
        execute_update("UPDATE user_profile SET email = %s WHERE user_id = %s",
                       (email, row["id"]))


def _setup_user_with_phone(username: str, phone: str) -> None:
    """Tạo test user rồi set phone cụ thể trong user_profile."""
    delete_user(username)
    create_test_user(username)
    row = get_user(username)
    if row:
        execute_update("UPDATE user_profile SET phone = %s WHERE user_id = %s",
                       (phone, row["id"]))


def _try_register(driver, username: str, **overrides):
    """Mở trang register, fill form BASE + overrides, submit."""
    page = RegisterPage(driver)
    page.open()
    form = {**BASE, "username": username, **overrides}
    page.fill_full_form(**form)
    page.click_submit()
    return page


def _assert_bug_if_success(page, driver, username: str, test_id: str, msg: str):
    """Nếu đăng ký thành công (app bug): xóa user vừa tạo rồi fail test.
    
    Chờ 2s để backend có đủ thời gian commit trước khi check DB.
    Cũng kiểm tra DB nếu app hiện lỗi UI nhưng vẫn tạo user ngầm.
    """
    import time
    redirected = page.is_redirected_to_login(timeout=4)
    time.sleep(2)  # chờ backend commit
    db_user = get_user(username)
    if redirected or db_user:
        delete_user(username)
        pytest.fail(f"[{test_id}] BUG — {msg} (redirected={redirected}, db_found={bool(db_user)})")


# ══════════════════════════════════════════════════════════════════════════════
class TestRegister:

    # ── DK_7 ──────────────────────────────────────────────────────────────────
    def test_register_success(self, driver):
        """[DK_7] Dữ liệu hợp lệ → đăng ký thành công, redirect /login, user có trong DB."""
        delete_user(TEST_USERNAME)
        try:
            page = _try_register(driver, TEST_USERNAME)
            redirected = page.is_redirected_to_login(timeout=12)
            db_user = get_user(TEST_USERNAME)
            if redirected:
                assert db_user, "[DK_7] Redirect OK nhưng user không có trong DB!"
            elif not db_user:
                error = page.get_error_message(timeout=3)
                pytest.fail(f"[DK_7] Đăng ký thất bại. Error: '{error}'")
        finally:
            delete_user(TEST_USERNAME)

    # ── DK_8 ──────────────────────────────────────────────────────────────────
    def test_register_duplicate_username(self, driver):
        """[DK_8] Username đã tồn tại → không cho đăng ký, DB vẫn chỉ có 1 user."""
        delete_user(DUP_USERNAME)
        create_test_user(DUP_USERNAME)
        try:
            page = _try_register(driver, DUP_USERNAME,
                                 email="dup_u@gmail.com", phone="0987654321")
            assert not page.is_redirected_to_login(timeout=3), \
                "[DK_8] Hệ thống cho phép đăng ký username trùng — BUG!"
            assert page.get_error_message(timeout=5), \
                "[DK_8] Phải hiển thị lỗi khi username đã tồn tại"
            # DB verify: chỉ có đúng 1 user
            rows = execute_query(
                "SELECT COUNT(*) AS c FROM user WHERE username = %s", (DUP_USERNAME,)
            )
            count = rows[0]["c"] if rows else 0
            assert count == 1, f"[DK_8] DB phải chỉ có 1 user '{DUP_USERNAME}', got: {count}"
        finally:
            delete_user(DUP_USERNAME)

    # ── DK_10 ─────────────────────────────────────────────────────────────────
    def test_register_last_name_numbers(self, driver):
        """[DK_10] Họ nhập toàn số → hệ thống không cho phép. [BUG]"""
        delete_user("sel_ln_num")
        try:
            page = _try_register(driver, "sel_ln_num", last_name="2131312")
            _assert_bug_if_success(page, driver, "sel_ln_num", "DK_10",
                                   "Hệ thống cho phép nhập số vào trường Họ.")
        finally:
            delete_user("sel_ln_num")

    # ── DK_11 ─────────────────────────────────────────────────────────────────
    def test_register_last_name_special(self, driver):
        """[DK_11] Họ nhập ký tự đặc biệt → hệ thống không cho phép. [BUG]"""
        delete_user("sel_ln_sc")
        try:
            page = _try_register(driver, "sel_ln_sc", last_name="@##@$!")
            _assert_bug_if_success(page, driver, "sel_ln_sc", "DK_11",
                                   "Hệ thống cho phép nhập ký tự đặc biệt vào trường Họ.")
        finally:
            delete_user("sel_ln_sc")

    # ── DK_13 ─────────────────────────────────────────────────────────────────
    def test_register_first_name_numbers(self, driver):
        """[DK_13] Tên nhập toàn số → hệ thống không cho phép. [BUG]"""
        delete_user("sel_fn_num")
        try:
            page = _try_register(driver, "sel_fn_num", first_name="000231")
            _assert_bug_if_success(page, driver, "sel_fn_num", "DK_13",
                                   "Hệ thống cho phép nhập số vào trường Tên.")
        finally:
            delete_user("sel_fn_num")

    # ── DK_14 ─────────────────────────────────────────────────────────────────
    def test_register_first_name_special(self, driver):
        """[DK_14] Tên nhập ký tự đặc biệt → hệ thống không cho phép. [BUG]"""
        delete_user("sel_fn_sc")
        try:
            page = _try_register(driver, "sel_fn_sc", first_name="@##@$!")
            _assert_bug_if_success(page, driver, "sel_fn_sc", "DK_14",
                                   "Hệ thống cho phép nhập ký tự đặc biệt vào trường Tên.")
        finally:
            delete_user("sel_fn_sc")


    # ── DK_16 ─────────────────────────────────────────────────────────────────
    def test_register_username_special(self, driver):
        """[DK_16] Username chứa ký tự đặc biệt (%$%@) → hệ thống không cho phép. [BUG]"""
        uname = "pct_sel_u16"
        try:
            page = RegisterPage(driver)
            page.open()
            page.fill_full_form(**{**BASE, "username": "%$%@",
                                   "email": "sel_u16@gmail.com",
                                   "phone": "0988000222"})
            page.click_submit()
            import time; time.sleep(2)
            # Kiểm tra xem có user nào vừa được tạo không (username có thể bị sanitize)
            # Dùng email để tìm vì username ký tự đặc biệt có thể bị lưu khác
            rows = execute_query(
                "SELECT u.username FROM user u "
                "JOIN user_profile up ON u.id = up.user_id "
                "WHERE up.email = %s", ("sel_u16@gmail.com",)
            )
            if rows:
                for row in rows:
                    delete_user(row["username"])
                pytest.fail(
                    "[DK_16] BUG — Hệ thống cho phép ký tự đặc biệt trong username. "
                    f"User đã được tạo: {[r['username'] for r in rows]}"
                )
        finally:
            # Cleanup by email — cả email mới lẫn email cũ (từ run trước)
            for cleanup_email in ("sel_u16@gmail.com", "sel_uname_sc@gmail.com"):
                rows = execute_query(
                    "SELECT u.username FROM user u "
                    "JOIN user_profile up ON u.id = up.user_id "
                    "WHERE up.email = %s", (cleanup_email,)
                )
                for row in rows:
                    delete_user(row["username"])

    # ── DK_17 ─────────────────────────────────────────────────────────────────
    def test_register_empty_email(self, driver):
        """[DK_17] Bỏ trống email → không được đăng ký. [BUG — app cho đăng ký]"""
        try:
            page = _try_register(driver, "sel_empty_em", email="")
            _assert_bug_if_success(page, driver, "sel_empty_em", "DK_17",
                                   "Hệ thống cho phép đăng ký khi bỏ trống email.")
        finally:
            delete_user("sel_empty_em")

    # ── DK_18 ─────────────────────────────────────────────────────────────────
    def test_register_duplicate_email(self, driver):
        """[DK_18] Email đã được dùng → hệ thống phải báo lỗi.
        DB unique constraint ngăn tạo user, nhưng app phải hiện error message rõ ràng.
        """
        # Pre-cleanup: dọn data cũ từ run trước (nếu có)
        delete_user(DUP_EMAIL_USER)
        delete_user("sel_dup_em")
        _setup_user_with_email(DUP_EMAIL_USER, DUP_EMAIL)
        try:
            page = _try_register(driver, "sel_dup_em", email=DUP_EMAIL)
            redirected = page.is_redirected_to_login(timeout=4)
            db_user = get_user("sel_dup_em")
            if redirected or db_user:
                delete_user("sel_dup_em")
                pytest.fail("[DK_18] BUG — Hệ thống cho phép đăng ký email trùng.")
            error = page.get_error_message(timeout=5)
            if not error:
                pytest.fail(
                    "[DK_18] BUG UX — App không hiện thông báo lỗi khi email trùng."
                )
        finally:
            delete_user(DUP_EMAIL_USER)
            delete_user("sel_dup_em")

    # ── DK_19 ─────────────────────────────────────────────────────────────────
    def test_register_invalid_email(self, driver):
        """[DK_19] Email không hợp lệ (anv1@gmail) → backend phải từ chối. [BUG]
        Bypass HTML5 browser validation bằng nativeInputValueSetter (React-compatible).
        """
        import time
        from selenium.webdriver.common.by import By
        delete_user("sel_inv_em")
        try:
            page = RegisterPage(driver)
            page.open()
            page.fill_full_form(**{**BASE, "username": "sel_inv_em",
                                   "email": "placeholder@email.com"})
            # Tìm email input và bypass bằng nativeInputValueSetter
            try:
                email_input = driver.find_element(By.CSS_SELECTOR,
                    'input[name="email"], input[placeholder*="mail"], input[id*="mail"]')
                driver.execute_script("""
                    var setter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value').set;
                    setter.call(arguments[0], arguments[1]);
                    arguments[0].dispatchEvent(new Event('input', {bubbles: true}));
                    arguments[0].dispatchEvent(new Event('change', {bubbles: true}));
                """, email_input, "anv1@gmail")
            except Exception as e:
                pytest.skip(f"[DK_19] Không thể bypass HTML5 email validation: {e}")
            page.click_submit()
            time.sleep(2)
            db_user = get_user("sel_inv_em")
            if db_user:
                delete_user("sel_inv_em")
                pytest.fail("[DK_19] BUG — Backend chấp nhận email không hợp lệ 'anv1@gmail'.")
            error = page.get_error_message(timeout=5)
            if not error and not page.is_redirected_to_login(timeout=2):
                pytest.fail("[DK_19] BUG UX — App không hiện lỗi khi email không hợp lệ.")
        finally:
            delete_user("sel_inv_em")

    # ── DK_20 ─────────────────────────────────────────────────────────────────
    def test_register_empty_phone(self, driver):
        """[DK_20] Bỏ trống SĐT → không được đăng ký. [BUG — app cho đăng ký]"""
        try:
            page = _try_register(driver, "sel_empty_ph", phone="")
            _assert_bug_if_success(page, driver, "sel_empty_ph", "DK_20",
                                   "Hệ thống cho phép đăng ký khi bỏ trống số điện thoại.")
        finally:
            delete_user("sel_empty_ph")

    # ── DK_21 ─────────────────────────────────────────────────────────────────
    def test_register_duplicate_phone(self, driver):
        """[DK_21] SĐT đã được dùng → hệ thống phải báo lỗi.
        DB unique constraint ngăn tạo user, nhưng app phải hiện error message rõ ràng.
        """
        # Pre-cleanup: dọn data cũ từ run trước (nếu có)
        delete_user(DUP_PHONE_USER)
        delete_user("sel_dup_ph")
        _setup_user_with_phone(DUP_PHONE_USER, DUP_PHONE)
        try:
            page = _try_register(driver, "sel_dup_ph",
                                 email="sel_dup_ph@gmail.com", phone=DUP_PHONE)
            redirected = page.is_redirected_to_login(timeout=4)
            db_user = get_user("sel_dup_ph")
            if redirected or db_user:
                delete_user("sel_dup_ph")
                pytest.fail("[DK_21] BUG — Hệ thống cho phép đăng ký số điện thoại trùng.")
            error = page.get_error_message(timeout=5)
            if not error:
                pytest.fail(
                    "[DK_21] BUG UX — App không hiện thông báo lỗi khi SĐT trùng."
                )
        finally:
            delete_user(DUP_PHONE_USER)
            delete_user("sel_dup_ph")

    # ── DK_27 ─────────────────────────────────────────────────────────────────
    def test_register_future_dob(self, driver):
        """[DK_27] Ngày sinh tương lai (2030) → hệ thống không cho phép. [BUG]"""
        try:
            page = _try_register(driver, "sel_fut_dob", dob="2030-02-02")
            _assert_bug_if_success(page, driver, "sel_fut_dob", "DK_27",
                                   "Hệ thống chấp nhận ngày sinh tương lai (02/02/2030).")
        finally:
            delete_user("sel_fut_dob")

    # ── DK_32 + DK_33 ─────────────────────────────────────────────────────────
    def test_register_weak_password(self, driver):
        """[DK_32+33] Mật khẩu toàn số (123456) / toàn chữ (abcdef) → hệ thống từ chối. [BUG]"""
        for pw, test_id in [("123456", "DK_32"), ("abcdef", "DK_33")]:
            uname = f"sel_weak_{test_id.lower()}"
            try:
                page = _try_register(driver, uname,
                                     email=f"{uname}@gmail.com",
                                     password=pw, confirm_password=pw)
                _assert_bug_if_success(page, driver, uname, test_id,
                                       f"Hệ thống chấp nhận mật khẩu yếu '{pw}'.")
            finally:
                delete_user(uname)
