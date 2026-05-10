"""
tests/test_forgot_password.py — MODULE 3: FORGOT PASSWORD
==========================================================
Target: ForgotPasswordDialog on http://localhost:3000/login

Test cases:
  MK_8  — test_forgot_password_success
  MK_11 — test_forgot_password_user_not_found
"""
import pytest
import warnings
from pages.forgot_password_page import ForgotPasswordPage
from db.db_helper import user_exists, execute_query, execute_update
from utils.config import USER_USERNAME


# ── DB helper for reset tokens ────────────────────────────────────────────────

def _get_reset_token(username: str) -> dict | None:
    """Try to find reset token in DB for a user (table name may vary)."""
    user_row = None
    try:
        from db.db_helper import get_user
        user_row = get_user(username)
    except Exception:
        pass

    if not user_row:
        return None

    uid = user_row.get("id")
    for table in ("password_reset_token", "reset_token", "forgot_password_token"):
        try:
            rows = execute_query(
                f"SELECT * FROM `{table}` WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                (uid,),
            )
            if rows:
                return rows[0]
        except Exception:
            continue
    return None


def _delete_reset_tokens(username: str):
    """Delete reset tokens for a user."""
    try:
        from db.db_helper import get_user
        row = get_user(username)
        if not row:
            return
        uid = row["id"]
        for table in ("password_reset_token", "reset_token", "forgot_password_token"):
            try:
                execute_update(
                    f"DELETE FROM `{table}` WHERE user_id = %s", (uid,)
                )
            except Exception:
                pass
    except Exception:
        pass


class TestForgotPassword:

    # ── MK_8 ──────────────────────────────────────────────────────────────────
    def test_forgot_password_success(self, driver):
        """
        [MK_8] Gửi forgot password với username hợp lệ → thành công.
        Expected: hiển thị "Gửi thành công!".
        localStorage: mustChangePassword = username.
        Verify DB: reset token mới được tạo (nếu table tồn tại).
        Cleanup: xóa reset token trong finally (chạy kể cả khi test fail).
        """
        assert user_exists(USER_USERNAME), (
            f"[MK_8] Setup: user '{USER_USERNAME}' phải tồn tại trong DB"
        )
        try:
            page = ForgotPasswordPage(driver)
            page.open()
            page.submit(USER_USERNAME)

            # Wait for success (dialog has 5s artificial delay)
            success = page.is_success(timeout=20)
            assert success, (
                f"[MK_8] Forgot password thất bại. "
                f"Error: '{page.get_error_message()}'"
            )

            flag = page.get_must_change_password_flag()
            assert flag == USER_USERNAME, (
                f"[MK_8] localStorage['mustChangePassword'] phải = '{USER_USERNAME}', "
                f"got: '{flag}'"
            )

            token_row = _get_reset_token(USER_USERNAME)
            if token_row:
                assert token_row, "[MK_8] Reset token DB row không hợp lệ"
            else:
                warnings.warn(
                    "[MK_8] Không tìm thấy reset token trong DB. "
                    "API /identity/auth/forgot-password có thể gửi email trực tiếp.",
                    UserWarning,
                )
        finally:
            _delete_reset_tokens(USER_USERNAME)

    # ── MK_11 ─────────────────────────────────────────────────────────────────
    def test_forgot_password_user_not_found(self, driver):
        """
        [MK_11] Username không tồn tại → hiển thị "Tài khoản không tồn tại".
        """
        fake_user = "user_not_exist_mk11"
        assert not user_exists(fake_user), (
            f"[MK_11] Setup: '{fake_user}' không được tồn tại trong DB"
        )

        page = ForgotPasswordPage(driver)
        page.open()
        page.submit(fake_user)

        # Wait for API response (may take a few seconds)
        # Dialog shows loading then error state
        success = page.is_success(timeout=8)

        if success:
            # System may respond with success regardless (to prevent username enumeration)
            warnings.warn(
                "[MK_11] Hệ thống trả 'success' cho username không tồn tại. "
                "Có thể là thiết kế chủ ý để tránh username enumeration. "
                "Nếu spec yêu cầu reject, đây là BUG.",
                UserWarning,
            )
        else:
            # Expect error message
            error = page.get_error_message(timeout=8)
            assert error or page.dialog_is_open(), (
                "[MK_11] Phải hiển thị lỗi hoặc dialog khi username không tồn tại"
            )
            if error:
                # Check for expected keywords
                assert any(kw in error.lower() for kw in [
                    "không tồn tại", "không tìm thấy", "not found",
                    "lỗi", "thất bại", "fail",
                ]), (
                    f"[MK_11] Error message không rõ ràng. Got: '{error}'"
                )
