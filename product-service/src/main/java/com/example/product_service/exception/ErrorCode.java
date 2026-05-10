package com.example.product_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Bạn chưa đăng nhập hoặc token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu cần quyền truy cập.", HttpStatus.FORBIDDEN),
    CANNOT_SEND_EMAIL(1008, "Không thể gửi email. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.", HttpStatus.BAD_REQUEST),
    
    // Lỗi liên quan sản phẩm
    PRODUCT_NOT_FOUND(2001, "Không tìm thấy sản phẩm với ID đã cung cấp. Vui lòng kiểm tra lại ID sản phẩm.", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(2002, "Không tìm thấy danh mục với ID đã cung cấp. Vui lòng kiểm tra lại ID danh mục.", HttpStatus.NOT_FOUND),
    PARENT_CATEGORY_NOT_FOUND(2003, "Không tìm thấy danh mục cha với ID đã cung cấp. Vui lòng kiểm tra lại ID danh mục cha.", HttpStatus.NOT_FOUND),
    BRAND_NOT_FOUND(2004, "Không tìm thấy thương hiệu với ID đã cung cấp. Vui lòng kiểm tra lại ID thương hiệu.", HttpStatus.NOT_FOUND),
    PRODUCT_VARIANT_NOT_FOUND(2005, "Không tìm thấy biến thể sản phẩm với ID đã cung cấp. Vui lòng kiểm tra lại ID biến thể.", HttpStatus.NOT_FOUND),
    SPEC_ATTRIBUTE_NOT_FOUND(2006, "Không tìm thấy thuộc tính với ID đã cung cấp. Vui lòng kiểm tra lại ID thuộc tính.", HttpStatus.NOT_FOUND),
    VARIANT_SPEC_NOT_FOUND(2007, "Không tìm thấy thông số biến thể với ID đã cung cấp. Vui lòng kiểm tra lại ID thông số.", HttpStatus.NOT_FOUND),
    INSUFFICIENT_STOCK(2008, "Số lượng hàng trong kho không đủ. Vui lòng kiểm tra lại số lượng còn lại trong kho.", HttpStatus.BAD_REQUEST),
    INVALID_STOCK_QUANTITY(2009, "Số lượng hàng không hợp lệ. Số lượng phải lớn hơn hoặc bằng 0.", HttpStatus.BAD_REQUEST),
    
    // Lỗi liên quan đánh giá
    REVIEW_RATING_NOT_ALLOWED(2010, "Bạn chưa mua sản phẩm này nên không thể đánh giá. Bạn chỉ có thể để lại nhận xét.", HttpStatus.BAD_REQUEST),
    REVIEW_REQUIRED_FIELDS(2011, "Bạn phải cung cấp ít nhất đánh giá (rating) hoặc nhận xét (comment).", HttpStatus.BAD_REQUEST),
    INVALID_RATING(2012, "Đánh giá không hợp lệ. Đánh giá phải từ 1 đến 5 sao.", HttpStatus.BAD_REQUEST),
    REVIEW_ALREADY_EXISTS(2013, "Bạn đã đánh giá sản phẩm này rồi. Bạn chỉ có thể đánh giá một lần cho mỗi sản phẩm, nhưng có thể để lại nhiều nhận xét.", HttpStatus.BAD_REQUEST),
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
