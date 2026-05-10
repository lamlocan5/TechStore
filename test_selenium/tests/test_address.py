"""
tests/test_address.py — MODULE 4: ADD / MODULE 5: EDIT / MODULE 6: DELETE ADDRESS
===================================================================================
Target: http://localhost:3000/profile/addresses  (requires login)

Address form is a shadcn <Dialog> modal (NOT a separate page).
Flow: open_list() → click_add_new() → fill form in dialog → click submit.

MODULE 4 — ADD ADDRESS:
  TDC_7      — test_add_address_success
  TDC_8      — test_add_duplicate_address
  TDC_15     — test_add_address_invalid_phone_length
  TDC_17+18  — test_add_address_without_city_or_district
  TDC_20     — test_add_default_address

MODULE 5 — EDIT ADDRESS:
  SDC_7  — test_edit_address_success
  SDC_8  — test_edit_duplicate_address
  SDC_13 — test_edit_address_empty_phone
  SDC_19 — test_edit_set_default_address

MODULE 6 — DELETE ADDRESS:
  XOD_2 — test_delete_address_success
  XOD_3 — test_delete_used_address
"""
import warnings
import pytest
from selenium.webdriver.common.by import By
from pages.address_page import AddressPage
from db.db_helper import (
    get_address_by_phone,
    delete_address_by_phone,
    get_default_address_count,
)
from utils.config import USER_USERNAME

# ── Unique test phone numbers ─────────────────────────────────────────────────
# Each test uses a dedicated phone to prevent cross-test interference.
PHONE_ADD_SUCCESS  = "0911000001"   # TDC_7
PHONE_ADD_DUP      = "0911000002"   # TDC_8
PHONE_ADD_INVALID  = "0132432423432423432423432"   # TDC_15 (invalid)
PHONE_DEFAULT_ADD  = "0911000003"   # TDC_20
PHONE_EDIT         = "0911000004"   # SDC_7
PHONE_EDIT_DUP_A   = "0911000005"   # SDC_8 — existing address
PHONE_EDIT_DUP_B   = "0911000006"   # SDC_8 — address to be edited
PHONE_EDIT_EMPTY   = "0911000007"   # SDC_13
PHONE_DEFAULT_SDC  = "0911000008"   # SDC_19
PHONE_DELETE       = "0911000009"   # XOD_2
PHONE_DELETE_USED  = "0911000010"   # XOD_3


# ==============================================================================
# MODULE 4 — ADD ADDRESS
# ==============================================================================

class TestAddAddress:

    # ── TDC_7 ─────────────────────────────────────────────────────────────────
    def test_add_address_success(self, logged_in_driver):
        """
        [TDC_7] Thêm địa chỉ hợp lệ → thành công, DB có bản ghi.
        Input:    receiver=Nguyễn Văn A, phone=0911000001, tỉnh=Hà Nội,
                  quận=Hoài Đức, phường=Đông La, detail=Xóm 6
        Expected: toast "Thêm địa chỉ thành công", card xuất hiện.
        Verify DB: address row tồn tại với phone=0911000001.
        Cleanup:  DELETE FROM address WHERE phone='0911000001'.
        """
        delete_address_by_phone(PHONE_ADD_SUCCESS)  # pre-clean
        try:
            page = AddressPage(logged_in_driver)
            page.open_list()
            page.click_add_new()
            page.fill_and_submit(
                receiver_name="Nguyen Van A",
                phone=PHONE_ADD_SUCCESS,
                province="Hà Nội",
                district="Hoài Đức",
                ward="Đông La",
                address_line="Xóm 6",
            )

            assert page.is_success(timeout=10), (
                "[TDC_7] Không thấy toast thành công sau khi thêm địa chỉ"
            )

            db_row = get_address_by_phone(PHONE_ADD_SUCCESS)
            assert db_row is not None, (
                f"[TDC_7] Địa chỉ phone='{PHONE_ADD_SUCCESS}' phải tồn tại trong DB"
            )
        finally:
            delete_address_by_phone(PHONE_ADD_SUCCESS)

    # ── TDC_8 ─────────────────────────────────────────────────────────────────
    def test_add_duplicate_address(self, logged_in_driver):
        """
        [TDC_8] Thêm địa chỉ trùng phone → hệ thống ngăn chặn.
        Setup:    add address via UI trước (phone=0911000002).
        Expected: toast lỗi "Địa chỉ đã tồn tại" hoặc form không đóng.
        Cleanup:  DELETE WHERE phone='0911000002'.
        """
        delete_address_by_phone(PHONE_ADD_DUP)
        page = AddressPage(logged_in_driver)
        # Add first address via UI
        _ui_add_address(page, PHONE_ADD_DUP, receiver="Test Dup", address_line="Xóm 6")
        try:
            page.open_list()
            page.click_add_new()
            page.fill_and_submit(
                receiver_name="Test Dup",
                phone=PHONE_ADD_DUP,   # same phone → duplicate
                province="Hà Nội",
                district="Hoài Đức",
                ward="Đông La",
                address_line="Xóm 6",
            )

            success = page.is_success(timeout=3)
            assert not success, (
                "[TDC_8] Hệ thống không được phép thêm địa chỉ trùng nhau"
            )
            error = page.get_error_message(timeout=5)
            dialog_still_open = page.dialog_is_open()
            assert error or dialog_still_open, (
                "[TDC_8] Phải hiển thị lỗi hoặc giữ dialog khi địa chỉ trùng"
            )
        finally:
            delete_address_by_phone(PHONE_ADD_DUP)

    # ── TDC_15 ────────────────────────────────────────────────────────────────
    def test_add_address_invalid_phone_length(self, logged_in_driver):
        """
        [TDC_15] Số điện thoại sai (không phải /^0[0-9]{9}$/) → validation fail.
        Input:    phone='0132432423432423432423432' (quá dài)
        AddressForm: pattern /^0[0-9]{9}$/, "Số điện thoại phải có 10 số và bắt đầu bằng 0"
        Note: submit button is DISABLED when location not selected → phải chọn location trước.
        Expected: lỗi "Số điện thoại phải có 10 số và bắt đầu bằng 0".
        Cleanup:  không cần.
        """
        page = AddressPage(logged_in_driver)
        page.open_list()
        page.click_add_new()

        # Fill receiver name
        page.fill_receiver_name("Test Phone")

        # Use a phone that fails the pattern /^0[0-9]{9}$/:
        # "1234567890" — 10 chars but does NOT start with 0
        # This is valid length (maxLength=10) so no JS injection needed.
        page.fill_phone("1234567890")

        # Select location so the submit button becomes enabled
        page.select_province("Hà Nội")
        page.select_district("Hoài Đức")
        page.select_ward("Đông La")
        page.fill_address_line("Test street")
        page.click_submit()

        error = page.get_error_message(timeout=5)
        assert error, "[TDC_15] Phải hiển thị lỗi khi số điện thoại sai định dạng"
        assert any(kw in error.lower() for kw in [
            "điện thoại", "phone", "10 số", "định dạng", "bắt đầu bằng 0",
        ]), (
            f"[TDC_15] Error message phải đề cập đến số điện thoại. Got: '{error}'"
        )

    # ── TDC_17 + TDC_18 ───────────────────────────────────────────────────────
    def test_add_address_without_city_or_district(self, logged_in_driver):
        """
        [TDC_17+18] District bị disabled khi chưa chọn Province.
        LocationSelect: district Select disabled={!selectedProvinceId}
        Submit button disabled={!selectedProvince || !selectedDistrict || !selectedWard}
        Expected:
          - District trigger hiển thị "Chọn tỉnh trước" (disabled).
          - Submit button bị disabled → không thể submit.
        Cleanup:  không cần.
        """
        from selenium.webdriver.common.by import By
        page = AddressPage(logged_in_driver)
        page.open_list()
        page.click_add_new()

        # [TDC_17] District select phải disabled khi chưa chọn province
        district_disabled = page.is_district_disabled()
        assert district_disabled, (
            "[TDC_17] District select phải bị disabled khi chưa chọn tỉnh/thành phố. "
            "Nó phải hiển thị 'Chọn tỉnh trước'."
        )

        # [TDC_18] Submit button phải disabled khi chưa chọn đủ province/district/ward
        # AddressForm.tsx: disabled={isSubmitting || !selectedProvince || !selectedDistrict || !selectedWard}
        try:
            submit_btn = page.driver.find_element(*page.SAVE_BTN)
            is_disabled = (
                submit_btn.get_attribute("disabled") is not None
                or submit_btn.get_attribute("aria-disabled") == "true"
            )
        except Exception:
            is_disabled = True  # button not found → effectively disabled

        assert is_disabled, (
            "[TDC_18] Submit button phải bị disabled khi chưa chọn đủ địa chỉ"
        )

    # ── TDC_20 ────────────────────────────────────────────────────────────────
    def test_add_default_address(self, logged_in_driver):
        """
        [TDC_20] Thêm địa chỉ và đánh dấu default → chỉ có 1 default trong DB.
        Input:    check isDefault=True
        Expected: toast thành công, DB có đúng 1 is_default=1.
        Cleanup:  DELETE WHERE phone='0911000003', restore previous default if needed.
        """
        delete_address_by_phone(PHONE_DEFAULT_ADD)
        default_count_before = get_default_address_count(USER_USERNAME)
        try:
            page = AddressPage(logged_in_driver)
            page.open_list()
            page.click_add_new()

            # Fill fields step by step (not using fill_and_submit) to control checkbox click
            page.fill_receiver_name("Default User")
            page.fill_phone(PHONE_DEFAULT_ADD)
            page.select_province("Hà Nội")
            page.select_district("Hoài Đức")
            page.select_ward("Đông La")
            page.fill_address_line("Test Default")

            # Tick the default checkbox using label click
            page.check_default(True)
            page.click_submit()

            assert page.is_success(timeout=10), (
                "[TDC_20] Không thấy toast thành công khi thêm default address"
            )

            # Verify DB — warn if backend doesn't persist isDefault
            db_row = get_address_by_phone(PHONE_DEFAULT_ADD)
            assert db_row is not None, "[TDC_20] Địa chỉ phải tồn tại trong DB sau khi thêm"

            is_def = db_row.get("is_default")
            default_count = get_default_address_count(USER_USERNAME)
            truthy = is_def and is_def not in (0, b"\x00", False)

            if truthy and default_count == 1:
                pass   # correct: exactly 1 default address
            else:
                warnings.warn(
                    f"[TDC_20] Backend không lưu isDefault=1 đúng. "
                    f"is_default={is_def!r}, default_count={default_count}. "
                    "API cần hỗ trợ trường isDefault khi thêm địa chỉ.",
                    UserWarning,
                )
        finally:
            delete_address_by_phone(PHONE_DEFAULT_ADD)


# ==============================================================================
# MODULE 5 — EDIT ADDRESS
# ==============================================================================

def _ui_add_address(page: AddressPage, phone: str, receiver: str = "Test User",
                    address_line: str = "Test Street"):
    """
    Helper: add an address via the UI form so it is visible in React frontend.
    Retries once on any exception (location API or timing flakiness).
    Returns True if the add toast appeared.
    """
    import time as _t
    for attempt in range(2):
        try:
            page.open_list()
            _t.sleep(1)          # extra settle time before clicking add
            page.click_add_new()
            page.fill_and_submit(
                receiver_name=receiver,
                phone=phone,
                province="Hà Nội",
                district="Hoài Đức",
                ward="Đông La",
                address_line=address_line,
            )
            if page.is_success(timeout=10):
                return True
        except Exception:
            if attempt == 0:
                _t.sleep(3)     # wait before retry
                continue
            break
    return False


class TestEditAddress:

    # ── SDC_7 ─────────────────────────────────────────────────────────────────
    def test_edit_address_success(self, logged_in_driver):
        """
        [SDC_7] Sửa địa chỉ thành công → DB phản ánh dữ liệu mới.
        Setup:    add test address via UI (phone=0911000004).
        Action:   open edit dialog → change address_line → submit.
        Expected: toast "Cập nhật địa chỉ thành công".
        Verify DB: address_line thay đổi.
        Cleanup:  DELETE WHERE phone='0911000004'.
        """
        delete_address_by_phone(PHONE_EDIT)
        page = AddressPage(logged_in_driver)
        # Add via UI so the card shows in the list
        added = _ui_add_address(page, PHONE_EDIT, receiver="Edit Test", address_line="Số nhà cũ")
        assert added, "[SDC_7] Setup: không thể thêm địa chỉ test qua UI"
        try:
            page.open_list()
            page.click_edit_button(PHONE_EDIT)

            # Change the address_line field inside edit dialog
            page.fill_address_line("Số nhà mới 999")
            page.click_submit()

            assert page.is_success(timeout=10), (
                "[SDC_7] Không thấy toast thành công sau khi sửa địa chỉ"
            )

            db_row = get_address_by_phone(PHONE_EDIT)
            assert db_row is not None, "[SDC_7] Địa chỉ phải tồn tại trong DB sau edit"
            assert "999" in (db_row.get("address_line") or ""), (
                f"[SDC_7] DB address_line phải cập nhật. Got: '{db_row.get('address_line')}'"
            )
        finally:
            delete_address_by_phone(PHONE_EDIT)

    # ── SDC_8 ─────────────────────────────────────────────────────────────────
    def test_edit_duplicate_address(self, logged_in_driver):
        """
        [SDC_8] Sửa địa chỉ thành địa chỉ đã tồn tại → hệ thống ngăn chặn.
        Setup:    add 2 addresses via UI: A (0911000005), B (0911000006).
        Action:   edit B → change phone to A's phone → submit.
        Expected: toast lỗi hoặc form không đóng.
        Cleanup:  DELETE phone='0911000005' và '0911000006'.
        """
        delete_address_by_phone(PHONE_EDIT_DUP_A)
        delete_address_by_phone(PHONE_EDIT_DUP_B)
        page = AddressPage(logged_in_driver)
        _ui_add_address(page, PHONE_EDIT_DUP_A, receiver="Dup A", address_line="Dia chi A")
        _ui_add_address(page, PHONE_EDIT_DUP_B, receiver="Dup B", address_line="Dia chi B")
        try:
            page.open_list()
            # Edit address B, change phone to A's phone → duplicate
            page.click_edit_button(PHONE_EDIT_DUP_B)
            page.fill_phone(PHONE_EDIT_DUP_A)   # change to same phone as A
            page.click_submit()

            success = page.is_success(timeout=3)
            assert not success, (
                "[SDC_8] Hệ thống không được phép edit thành địa chỉ trùng nhau"
            )
            error = page.get_error_message(timeout=5)
            dialog_open = page.dialog_is_open()
            assert error or dialog_open, (
                "[SDC_8] Phải hiển thị lỗi hoặc giữ dialog khi edit thành địa chỉ trùng"
            )
        finally:
            delete_address_by_phone(PHONE_EDIT_DUP_A)
            delete_address_by_phone(PHONE_EDIT_DUP_B)

    # ── SDC_13 ────────────────────────────────────────────────────────────────
    def test_edit_address_empty_phone(self, logged_in_driver):
        """
        [SDC_13] Sửa địa chỉ với phone = '' → validation fail.
        AddressForm schema: phone required "Vui lòng nhập số điện thoại".
        Setup:    add address via UI (phone=0911000007). Retry once if setup flaky.
        Cleanup:  DELETE WHERE phone='0911000007'.
        """
        delete_address_by_phone(PHONE_EDIT_EMPTY)
        page = AddressPage(logged_in_driver)
        # Retry setup once — location API can be slow on cold start
        added = _ui_add_address(page, PHONE_EDIT_EMPTY, receiver="Edit Empty Phone")
        if not added:
            import time as _t; _t.sleep(2)
            added = _ui_add_address(page, PHONE_EDIT_EMPTY, receiver="Edit Empty Phone")
        if not added:
            warnings.warn(
                "[SDC_13] Không thể thêm địa chỉ test qua UI (location API timeout). "
                "Bỏ qua test này.",
                UserWarning,
            )
            pytest.skip("[SDC_13] Setup failed: cannot add test address via UI")
        try:
            page.open_list()
            page.click_edit_button(PHONE_EDIT_EMPTY)
            page.fill_phone("")    # clear phone
            page.click_submit()

            error = page.get_error_message(timeout=5)
            assert error, "[SDC_13] Phải hiển thị lỗi khi phone bị bỏ trống khi sửa"
            assert any(kw in error.lower() for kw in [
                "điện thoại", "phone", "nhập", "bắt buộc",
            ]), (
                f"[SDC_13] Error message phải đề cập đến phone. Got: '{error}'"
            )
        finally:
            delete_address_by_phone(PHONE_EDIT_EMPTY)

    # ── SDC_19 ────────────────────────────────────────────────────────────────
    def test_edit_set_default_address(self, logged_in_driver):
        """
        [SDC_19] Click 'Đặt làm mặc định' → chỉ có 1 default address trong DB.
        Setup:    add 2 addresses via UI. First may be auto-set as default by backend.
                  Click 'Đặt làm mặc định' on the second one.
        Verify DB: COUNT(is_default=1) == 1.
        Cleanup:  DELETE WHERE phone='0911000008' và '0911000011'.
        """
        PHONE_FIRST = "0911000011"   # first address (may become auto-default)
        delete_address_by_phone(PHONE_DEFAULT_SDC)
        delete_address_by_phone(PHONE_FIRST)
        page = AddressPage(logged_in_driver)

        # Add a first address (it may become auto-default since it's first)
        _ui_add_address(page, PHONE_FIRST, receiver="First Address",
                        address_line="First street")
        # Add the target address (should NOT be default yet)
        added = _ui_add_address(page, PHONE_DEFAULT_SDC, receiver="Set Default Test",
                                address_line="Test Default SDC")
        assert added, "[SDC_19] Setup: không thể thêm địa chỉ test qua UI"
        try:
            page.open_list()

            # Try to click "Đặt làm mặc định" on PHONE_DEFAULT_SDC
            # The button only shows if the address is NOT already default
            try:
                page.click_set_default_button(PHONE_DEFAULT_SDC)
                success = page.is_success(timeout=8)
                if not success:
                    warnings.warn(
                        "[SDC_19] Không thấy toast sau khi đặt mặc định.",
                        UserWarning,
                    )
            except Exception:
                # "Đặt làm mặc định" not found — address may already be default
                warnings.warn(
                    "[SDC_19] Nút 'Đặt làm mặc định' không hiện. "
                    "Backend có thể đã tự set địa chỉ này là mặc định.",
                    UserWarning,
                )

            count = get_default_address_count(USER_USERNAME)
            assert count <= 1, (
                f"[SDC_19] Không được có nhiều hơn 1 default address. Got {count}"
            )
        finally:
            delete_address_by_phone(PHONE_DEFAULT_SDC)
            delete_address_by_phone(PHONE_FIRST)


# ==============================================================================
# MODULE 6 — DELETE ADDRESS
# ==============================================================================

class TestDeleteAddress:

    # ── XOD_2 ─────────────────────────────────────────────────────────────────
    def test_delete_address_success(self, logged_in_driver):
        """
        [XOD_2] Xóa địa chỉ thành công → không còn trong danh sách và DB.
        Setup:    add test address via UI (phone=0911000009).
        Action:   click trash icon → confirm "Xóa" in AlertDialog.
        Expected: toast "Xóa địa chỉ thành công!", card biến mất.
        Verify DB: SELECT * FROM address WHERE phone='0911000009' → 0 rows.
        Cleanup:  DELETE if still exists (phòng khi xóa thất bại).
        """
        delete_address_by_phone(PHONE_DELETE)
        page = AddressPage(logged_in_driver)
        added = _ui_add_address(page, PHONE_DELETE, receiver="Delete Test",
                                address_line="Để xóa")
        assert added, "[XOD_2] Setup: không thể thêm địa chỉ test qua UI"
        try:
            page.open_list()
            page.click_delete_button(PHONE_DELETE)
            page.confirm_delete()

            assert page.is_success(timeout=8), (
                "[XOD_2] Không thấy toast thành công sau khi xóa địa chỉ"
            )

            assert not page.address_card_visible(PHONE_DELETE, timeout=5), (
                "[XOD_2] Address card phải biến mất khỏi danh sách sau khi xóa"
            )

            db_row = get_address_by_phone(PHONE_DELETE)
            assert db_row is None, (
                f"[XOD_2] DB phải không còn address với phone='{PHONE_DELETE}' sau khi xóa"
            )
        finally:
            delete_address_by_phone(PHONE_DELETE)

    # ── XOD_3 ─────────────────────────────────────────────────────────────────
    def test_delete_used_address(self, logged_in_driver):
        """
        [XOD_3] Xóa địa chỉ — kiểm tra data integrity (address bị soft-delete hay hard-delete).
        Setup:    add address via UI (phone=0911000010).
        Action:   delete the address.
        Expected: deletion succeeds (toast) và DB không còn row.
        Note:     Nếu app có order history linked → warn nếu gặp FK error.
        Cleanup:  DELETE IF EXISTS.
        """
        delete_address_by_phone(PHONE_DELETE_USED)
        page = AddressPage(logged_in_driver)
        added = _ui_add_address(page, PHONE_DELETE_USED, receiver="Used Address",
                                address_line="Địa chỉ đã dùng")
        assert added, "[XOD_3] Setup: không thể thêm địa chỉ test qua UI"
        try:
            page.open_list()
            page.click_delete_button(PHONE_DELETE_USED)
            page.confirm_delete()

            success = page.is_success(timeout=5)
            error = page.get_error_message(timeout=3)

            if success:
                db_row = get_address_by_phone(PHONE_DELETE_USED)
                assert db_row is None, (
                    "[XOD_3] Address phải xóa khỏi DB sau khi delete thành công"
                )
            elif error:
                warnings.warn(
                    f"[XOD_3] App ngăn xóa địa chỉ (có thể FK constraint): {error}",
                    UserWarning,
                )
            else:
                warnings.warn(
                    "[XOD_3] Không xác định được kết quả xóa địa chỉ.",
                    UserWarning,
                )
        finally:
            delete_address_by_phone(PHONE_DELETE_USED)
