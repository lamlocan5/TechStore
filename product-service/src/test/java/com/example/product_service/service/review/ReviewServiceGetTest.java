package com.example.product_service.service.review;

import com.example.product_service.client.OrderServiceClient;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ReviewServiceGetTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    // Giả lập OrderServiceClient để ApplicationContext không cố gắng init Feign Client thật
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
     * TEST CASE ID: PRD_65
     */
    @Test
    @DisplayName("PRD_65: Lấy danh sách review theo productId có phân trang thành công")
    void PRD_65_getReviews_success() {
        // 1. INPUT
        ProductEntity product = createProduct();
        
        ReviewEntity review1 = ReviewEntity.builder().productId(product.getId()).userId("user1").rating(5).comment("Good").build();
        ReviewEntity review2 = ReviewEntity.builder().productId(product.getId()).userId("user2").rating(4).comment("Nice").build();
        reviewRepository.save(review1);
        reviewRepository.save(review2);
        reviewRepository.flush();

        PageRequest pageRequest = PageRequest.of(0, 10);

        // 2. GỌI HÀM
        Page<ReviewResponse> response = reviewService.getReviewsByProductId(product.getId(), pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(2, response.getTotalElements());
    }

    /**
     * TEST CASE ID: PRD_66
     */
    @Test
    @DisplayName("PRD_66: Lấy danh sách phân trang thất bại do productId không tồn tại")
    void PRD_66_getReviews_notFound_fail() {
        // 1. INPUT
        Long invalidProductId = 999L;
        PageRequest pageRequest = PageRequest.of(0, 10);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            reviewService.getReviewsByProductId(invalidProductId, pageRequest);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }
}
