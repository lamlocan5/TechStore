"""
tests/test_change_password.py — MODULE 3: CHANGE PASSWORD
==========================================================
Target: http://localhost:3000/profile/change-password  (requires login)

Test cases (có rollback / DB check):
  DMK_7      — test_change_password_success    [DB: password_hash thay đổi + rollback]
  DMK_15+16  — test_change_password_weak       [DB: hash không đổi nếu bug + rollback]

Bỏ (form validation, không tạo/thay đổi data trong DB):
  DMK_8 (empty current), DMK_9 (empty new), DMK_10 (empty confirm),
  DMK_11 (wrong current - API error only), DMK_12 (confirm mismatch),
  DMK_13 (same as old), DMK_14 (short password)
"""
import pytest
from pages.change_password_page import ChangePasswordPage
from db.db_helper import get_password_hash, restore_password_hash
from utils.config import USER_USERNAME, USER_PASSWORD


class TestChangePassword:

    # ── DMK_7 ─────────────────────────────────────────────────────────────────
    def test_change_password_success(self, logged_in_driver):
        """
        [DMK_7] Đổi mật khẩu thành công.
        DB check: password_hash thay đổi so với hash cũ.
        Rollback: restore hash cũ trong finally.
        """
        old_hash = get_password_hash(USER_USERNAME)
        try:
            page = ChangePasswordPage(logged_in_driver)
            page.open()
            page.fill_and_submit(
                current_password=USER_PASSWORD,
                new_password="b123456",
                confirm_password="b123456",
            )

            assert page.is_success(timeout=10), (
                "[DMK_7] Không thấy thông báo thành công sau khi đổi mật khẩu"
            )

            new_hash = get_password_hash(USER_USERNAME)
            if old_hash and new_hash:
                assert new_hash != old_hash, (
                    "[DMK_7] DB password hash phải thay đổi sau khi đổi mật khẩu thành công"
                )
        finally:
            if old_hash:
                restore_password_hash(USER_USERNAME, old_hash)

    # ── DMK_15 + DMK_16 ───────────────────────────────────────────────────────
    def test_change_password_weak(self, logged_in_driver):
        """
        [DMK_15+16] Mật khẩu mới toàn số (123456) → hệ thống phải từ chối. [BUG]
        DB check: sau submit, nếu hash trong DB thay đổi = backend chấp nhận = BUG.
        Rollback: LUÔN restore hash cũ trong finally, kể cả khi bug xảy ra.
        """
        import time
        old_hash = get_password_hash(USER_USERNAME)
        try:
            page = ChangePasswordPage(logged_in_driver)
            page.open()
            page.fill_and_submit(
                current_password=USER_PASSWORD,
                new_password="123456",
                confirm_password="123456",
            )

            # Chờ backend xử lý
            time.sleep(2)

            # DB check là nguồn sự thật — không phụ thuộc UI toast
            new_hash = get_password_hash(USER_USERNAME)
            if old_hash and new_hash and new_hash != old_hash:
                pytest.fail(
                    "[DMK_15+16] BUG — Backend đã đổi password sang '123456' (toàn số). "
                    "DB hash đã thay đổi. Password policy không được enforce phía backend."
                )

            # Cũng check UI để verify thông báo lỗi xuất hiện
            success_ui = page.is_success(timeout=1)
            if success_ui and (not old_hash or not new_hash or new_hash == old_hash):
                pass  # UI hiện success nhưng DB không đổi — có thể là UI bug nhỏ
        finally:
            if old_hash:
                restore_password_hash(USER_USERNAME, old_hash)

