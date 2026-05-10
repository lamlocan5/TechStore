package com.example.product_service.service;

import com.example.product_service.client.OrderServiceClient;
import com.example.product_service.dto.request.ReviewRequest;
import com.example.product_service.dto.response.ReviewResponse;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.entity.ReviewEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.repository.ReviewRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderServiceClient orderServiceClient;

    /**
     * Tạo review hoặc comment cho sản phẩm
     * - Nếu user đã mua: có thể đánh giá (rating 1-5) + comment
     * - Nếu user chưa mua: chỉ có thể comment (không có rating, không giới hạn số lần)
     */
    public ReviewResponse createReview(String userId, ReviewRequest request) {
        // Kiểm tra sản phẩm tồn tại
        ProductEntity product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Kiểm tra user đã mua sản phẩm chưa
        boolean hasPurchased = orderServiceClient.hasUserPurchasedProduct(userId, request.getProductId());

        // Validation: Nếu user chưa mua nhưng có rating thì không cho phép
        if (!hasPurchased && request.getRating() != null) {
            throw new AppException(ErrorCode.REVIEW_RATING_NOT_ALLOWED);
        }

        // Validation: Phải có ít nhất rating hoặc comment
        if (request.getRating() == null && (request.getComment() == null || request.getComment().trim().isEmpty())) {
            throw new AppException(ErrorCode.REVIEW_REQUIRED_FIELDS);
        }

        // Validation: Rating phải từ 1-5
        if (request.getRating() != null && (request.getRating() < 1 || request.getRating() > 5)) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }

        // Kiểm tra xem user đã rating sản phẩm này chưa (chỉ kiểm tra khi user muốn rating)
        if (request.getRating() != null) {
            reviewRepository.findByProductIdAndUserId(request.getProductId(), userId)
                    .ifPresent(existingReview -> {
                        // Chỉ throw error nếu user đã rating, còn nếu chỉ comment thì cho phép
                        if (existingReview.getRating() != null) {
                            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
                        }
                    });
        }

        // Tạo review entity
        ReviewEntity review = ReviewEntity.builder()
                .productId(request.getProductId())
                .userId(userId)
                .rating(hasPurchased ? request.getRating() : null) // Chỉ set rating nếu đã mua
                .comment(request.getComment())
                .build();

        ReviewEntity savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    /**
     * Lấy tất cả reviews và comments của một sản phẩm
     */
    public Page<ReviewResponse> getReviewsByProductId(Long productId, Pageable pageable) {
        // Kiểm tra sản phẩm tồn tại
        productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return reviewRepository.findByProductId(productId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Lấy tất cả reviews và comments của một sản phẩm (không phân trang)
     */
    public List<ReviewResponse> getAllReviewsByProductId(Long productId) {
        // Kiểm tra sản phẩm tồn tại
        productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return reviewRepository.findByProductId(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(ReviewEntity entity) {
        return ReviewResponse.builder()
                .id(entity.getId())
                .productId(entity.getProductId())
                .userId(entity.getUserId())
                .rating(entity.getRating())
                .comment(entity.getComment())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

