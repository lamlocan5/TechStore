package com.example.notification.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(
            9999,
            "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
            HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(
            1001, "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(
            1006,
            "Bạn chưa đăng nhập hoặc token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
            HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(
            1007,
            "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu cần quyền truy cập.",
            HttpStatus.FORBIDDEN),
    CANNOT_SEND_EMAIL(
            1008,
            "Không thể gửi email. Vui lòng kiểm tra địa chỉ email người nhận, cấu hình email server hoặc thử lại sau.",
            HttpStatus.BAD_REQUEST),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
