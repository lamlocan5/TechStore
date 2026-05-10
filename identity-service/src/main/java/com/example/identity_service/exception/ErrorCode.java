package com.example.identity_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Tên người dùng đã tồn tại. Vui lòng chọn tên người dùng khác.", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất {min} ký tự. Vui lòng nhập tên người dùng dài hơn.", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1004, "Email đã được sử dụng. Vui lòng chọn email khác.", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1005, "Số điện thoại đã được sử dụng. Vui lòng chọn số điện thoại khác.", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1006, "Mật khẩu phải có ít nhất {min} ký tự. Vui lòng nhập mật khẩu mạnh hơn.", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1007, "Không tìm thấy người dùng với thông tin đã cung cấp. Vui lòng kiểm tra lại tên đăng nhập hoặc ID người dùng.", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1008, "Bạn chưa đăng nhập hoặc token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1009, "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu cần quyền truy cập.", HttpStatus.FORBIDDEN),
    INVALID_DOB(1010, "Bạn phải đủ {min} tuổi để sử dụng dịch vụ này. Vui lòng kiểm tra lại ngày sinh.", HttpStatus.BAD_REQUEST),
    INCORRECT_PASSWORD(1011, "Tài khoản và mật khẩu không đúng. Vui lòng kiểm tra lại", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(1012, "User này không tồn tại trong hệ thống. Vui lòng kiểm tra lại", HttpStatus.NOT_FOUND),
    CANNOT_SEND_EMAIL(1013, "Không thể gửi email. Vui lòng thử lại sau.", HttpStatus.INTERNAL_SERVER_ERROR),
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
