package com.example.order_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu cần quyền truy cập.", HttpStatus.FORBIDDEN),
    
    // Order errors
    ORDER_NOT_FOUND(2001, "Không tìm thấy đơn hàng với ID đã cung cấp. Vui lòng kiểm tra lại ID đơn hàng.", HttpStatus.NOT_FOUND),
    ORDER_CANNOT_CANCEL_COMPLETED(2002, "Không thể hủy đơn hàng đã hoàn thành. Chỉ có thể hủy đơn hàng ở trạng thái PENDING, PAID hoặc SHIPPING.", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_CANCELLED(2003, "Đơn hàng này đã được hủy trước đó. Không thể hủy lại.", HttpStatus.BAD_REQUEST),
    ORDER_INVALID_STATUS_TRANSITION(2004, "Trạng thái đơn hàng không hợp lệ. Vui lòng tuân thủ lộ trình PENDING -> PAID -> SHIPPING -> COMPLETED hoặc CANCELLED.", HttpStatus.BAD_REQUEST),
    
    // Cart errors
    CART_NOT_FOUND(3001, "Không tìm thấy giỏ hàng. Vui lòng thêm sản phẩm vào giỏ hàng trước.", HttpStatus.NOT_FOUND),
    CART_ITEM_NOT_FOUND(3002, "Không tìm thấy sản phẩm trong giỏ hàng với ID đã cung cấp. Vui lòng kiểm tra lại ID sản phẩm.", HttpStatus.NOT_FOUND),
    CART_ITEM_NOT_BELONG_TO_USER(3003, "Sản phẩm này không thuộc giỏ hàng của bạn. Vui lòng kiểm tra lại.", HttpStatus.FORBIDDEN),
    CART_ITEM_QUANTITY_INVALID(3004, "Số lượng sản phẩm phải lớn hơn 0. Vui lòng nhập số lượng hợp lệ.", HttpStatus.BAD_REQUEST),
    
    // Voucher errors
    VOUCHER_NOT_FOUND(4001, "Không tìm thấy mã giảm giá với ID hoặc mã code đã cung cấp. Vui lòng kiểm tra lại mã giảm giá.", HttpStatus.NOT_FOUND),
    VOUCHER_NOT_ACTIVE(4002, "Mã giảm giá này không còn hoạt động. Vui lòng chọn mã giảm giá khác.", HttpStatus.BAD_REQUEST),
    VOUCHER_NOT_VALID_TIME(4003, "Mã giảm giá này chưa có hiệu lực hoặc đã hết hạn. Vui lòng kiểm tra thời gian áp dụng của mã.", HttpStatus.BAD_REQUEST),
    VOUCHER_MIN_ORDER_NOT_MET(4004, "Tổng giá trị đơn hàng chưa đạt mức tối thiểu để áp dụng mã giảm giá này. Vui lòng thêm sản phẩm vào giỏ hàng.", HttpStatus.BAD_REQUEST),
    VOUCHER_USAGE_LIMIT_REACHED(4005, "Mã giảm giá này đã đạt giới hạn sử dụng. Vui lòng chọn mã giảm giá khác.", HttpStatus.BAD_REQUEST),
    VOUCHER_USER_USAGE_LIMIT_REACHED(4006, "Bạn đã sử dụng hết số lần được phép sử dụng mã giảm giá này. Vui lòng chọn mã giảm giá khác.", HttpStatus.BAD_REQUEST),
    VOUCHER_RANK_NOT_ENOUGH(4007, "Hạng thành viên hiện tại của bạn không đủ để sử dụng mã giảm giá này.", HttpStatus.FORBIDDEN),
    VOUCHER_NOT_IN_WALLET(4008, "Bạn chưa sở hữu mã giảm giá này trong kho voucher cá nhân.", HttpStatus.BAD_REQUEST),
    
    // Stock errors
    INSUFFICIENT_STOCK(5001, "Số lượng hàng trong kho không đủ. Vui lòng kiểm tra lại số lượng còn lại trong kho.", HttpStatus.BAD_REQUEST),
    PRODUCT_VARIANT_NOT_FOUND(5002, "Không tìm thấy biến thể sản phẩm với ID đã cung cấp. Vui lòng kiểm tra lại ID biến thể.", HttpStatus.NOT_FOUND),
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

