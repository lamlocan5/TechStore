package com.example.product_service.service.review;

import com.example.product_service.client.OrderServiceClient;
import com.example.product_service.dto.request.ReviewRequest;
import com.example.product_service.dto.response.ReviewResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.entity.ReviewEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.repository.ReviewRepository;
import com.example.product_service.service.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ReviewServiceCreateTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    // Giả lập OrderServiceClient để không bị phụ thuộc vào service khác
    @MockBean
    private OrderServiceClient orderServiceClient;

    private ProductEntity createProduct() {
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity product = new ProductEntity();
        product.setName("Product 1");
        product.setBrand(brand);
        product.setStatus(true);
        return productRepository.saveAndFlush(product);
    }

    /**
     * TEST CASE ID: PRD_58
     */
    @Test
    @DisplayName("PRD_58: Thêm review thành công (Đã mua, có rating + comment)")
    void PRD_58_createReview_success() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .comment("Sản phẩm rất tốt")
                .build();

        // Giả lập người dùng đã mua hàng
        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(true);

        // 2. GỌI HÀM
        ReviewResponse response = reviewService.createReview(userId, request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Sản phẩm rất tốt", response.getComment());
        assertTrue(reviewRepository.existsById(response.getId()));
    }

    /**
     * TEST CASE ID: PRD_59
     */
    @Test
    @DisplayName("PRD_59: Thêm review thất bại do sản phẩm không tồn tại")
    void PRD_59_createReview_productNotFound_fail() {
        // 1. INPUT
        String userId = "user-123";
        ReviewRequest request = ReviewRequest.builder()
                .productId(999L) // Không tồn tại
                .rating(5)
                .comment("Test")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.createReview(userId, request);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_60
     */
    @Test
    @DisplayName("PRD_60: Thêm review thất bại do chưa mua nhưng cố gửi rating")
    void PRD_60_createReview_notPurchasedButRating_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(5) // Cố gửi rating
                .comment("Chưa mua nhưng đánh giá 5 sao")
                .build();

        // Giả lập người dùng CHƯA mua hàng
        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(false);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.createReview(userId, request);
        });
        assertEquals(ErrorCode.REVIEW_RATING_NOT_ALLOWED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_61
     */
    @Test
    @DisplayName("PRD_61: Thêm review thất bại do không có cả rating và comment")
    void PRD_61_createReview_emptyFields_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(null)
                .comment("") // Không nhập gì cả
                .build();

        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(true);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.createReview(userId, request);
        });
        assertEquals(ErrorCode.REVIEW_REQUIRED_FIELDS, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_62
     */
    @Test
    @DisplayName("PRD_62: Thêm review thất bại do rating ngoài khoảng 1-5")
    void PRD_62_createReview_invalidRating_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(6) // Lỗi do lớn hơn 5
                .comment("Test")
                .build();

        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(true);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.createReview(userId, request);
        });
        assertEquals(ErrorCode.INVALID_RATING, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_63
     */
    @Test
    @DisplayName("PRD_63: Thêm review thất bại do một user cố tình đánh giá 2 lần")
    void PRD_63_createReview_duplicateRating_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        // Giả lập người dùng đã mua hàng
        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(true);

        // Tạo sẵn 1 đánh giá của user này
        ReviewEntity existingReview = ReviewEntity.builder()
                .productId(product.getId())
                .userId(userId)
                .rating(4)
                .comment("Đánh giá lần 1")
                .build();
        reviewRepository.saveAndFlush(existingReview);

        // Cố tình đánh giá lần 2
        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .comment("Đánh giá lần 2")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.createReview(userId, request);
        });
        assertEquals(ErrorCode.REVIEW_ALREADY_EXISTS, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_64
     */
    @Test
    @DisplayName("PRD_64: Thêm review thất bại do chưa mua hàng đã gửi comment")
    void PRD_64_createReview_notPurchasedButComment_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();
        String userId = "user-123";

        ReviewRequest request = ReviewRequest.builder()
                .productId(product.getId())
                .rating(null) // Không có rating
                .comment("Comment khi chưa mua hàng")
                .build();

        // Giả lập người dùng CHƯA mua hàng
        Mockito.when(orderServiceClient.hasUserPurchasedProduct(userId, product.getId()))
                .thenReturn(false);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            reviewService.createReview(userId, request);
        }, "LỖI HỆ THỐNG: Yêu cầu chặn không cho người chưa mua hàng gửi comment!");
    }
}
