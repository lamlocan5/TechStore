package com.example.profile.exception;

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
    USER_EXISTED(1002, "Tên người dùng đã tồn tại. Vui lòng chọn tên người dùng khác.", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1003, "Email đã được sử dụng. Vui lòng chọn email khác.", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1004, "Số điện thoại đã được sử dụng. Vui lòng chọn số điện thoại khác.", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(
            1005,
            "Tên người dùng phải có ít nhất {min} ký tự. Vui lòng nhập tên người dùng dài hơn.",
            HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(
            1006, "Mật khẩu phải có ít nhất {min} ký tự. Vui lòng nhập mật khẩu mạnh hơn.", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(
            1007,
            "Không tìm thấy người dùng với thông tin đã cung cấp. Vui lòng kiểm tra lại tên đăng nhập hoặc ID người dùng.",
            HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(
            1008,
            "Bạn chưa đăng nhập hoặc token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
            HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(
            1009,
            "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu cần quyền truy cập.",
            HttpStatus.FORBIDDEN),
    INVALID_DOB(
            1010,
            "Bạn phải đủ {min} tuổi để sử dụng dịch vụ này. Vui lòng kiểm tra lại ngày sinh.",
            HttpStatus.BAD_REQUEST),
    PROFILE_NOT_FOUND(
            1011,
            "Không tìm thấy hồ sơ người dùng với ID đã cung cấp. Vui lòng kiểm tra lại ID hồ sơ.",
            HttpStatus.NOT_FOUND),
    ADDRESS_NOT_FOUND(
            1012, "Không tìm thấy địa chỉ với ID đã cung cấp. Vui lòng kiểm tra lại ID địa chỉ.", HttpStatus.NOT_FOUND),
    ADDRESS_EXISTED(1013, "Địa chỉ đã tồn tại. Vui lòng kiểm tra lại thông tin địa chỉ.", HttpStatus.BAD_REQUEST),
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
