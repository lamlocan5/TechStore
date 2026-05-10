package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.ReviewRequest;
import com.example.product_service.dto.response.ReviewResponse;
import com.example.product_service.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    private String getAuthenticatedUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Tạo review hoặc comment cho sản phẩm
     * - User đã mua: có thể đánh giá (rating 1-5) + comment
     * - User chưa mua: chỉ có thể comment (không có rating)
     */
    @PostMapping
    public ApiResponse<ReviewResponse> createReview(@RequestBody ReviewRequest request) {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<ReviewResponse>builder()
                .message("Review created successfully")
                .result(reviewService.createReview(userId, request))
                .build();
    }

    /**
     * Lấy tất cả reviews và comments của một sản phẩm (có phân trang)
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<PaginatedResponse<ReviewResponse>> getReviewsByProductId(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=20 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 20;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ReviewResponse> reviewPage = reviewService.getReviewsByProductId(productId, pageable);
        
        PaginatedResponse<ReviewResponse> paginatedResponse = PaginatedResponse.<ReviewResponse>builder()
                .result(reviewPage.getContent())
                .total(reviewPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(reviewPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<ReviewResponse>>builder()
                .message("Reviews retrieved successfully")
                .result(paginatedResponse)
                .build();
    }

    /**
     * Lấy tất cả reviews và comments của một sản phẩm (không phân trang)
     */
    @GetMapping("/product/{productId}/all")
    public ApiResponse<List<ReviewResponse>> getAllReviewsByProductId(@PathVariable Long productId) {
        return ApiResponse.<List<ReviewResponse>>builder()
                .message("All reviews retrieved successfully")
                .result(reviewService.getAllReviewsByProductId(productId))
                .build();
    }
}

