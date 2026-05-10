package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.response.ImageIndexResponse;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.service.AIImageSearchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Admin endpoint to manage AI image search indexing
 * Used for one-time migration and maintenance
 */
@RestController
@RequestMapping("/admin/image-index")
@RequiredArgsConstructor
@Slf4j
public class ImageIndexController {

    private final ProductRepository productRepository;
    private final AIImageSearchClient aiImageSearchClient;

    /**
     * Index ALL existing products (one-time migration)
     * This may take a while depending on the number of products
     */
    @PostMapping("/sync-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> syncAllProducts() {
        log.info("Starting full product index sync...");

        List<ProductEntity> allProducts = productRepository.findAll();
        int total = allProducts.size();
        int success = 0;
        int failed = 0;
        int skipped = 0;

        for (ProductEntity product : allProducts) {
            try {
                List<String> imageUrls = aiImageSearchClient.collectImageUrls(
                        product.getAvatar(),
                        product.getImages(),
                        product.getFirstImage()
                );

                if (imageUrls.isEmpty()) {
                    skipped++;
                    log.info("Product {} has no images, skipped", product.getId());
                    continue;
                }

                ImageIndexResponse result = aiImageSearchClient.indexProduct(product.getId(), imageUrls);

                if (result.getImagesIndexed() > 0) {
                    success++;
                    log.info("Indexed product {}: {} images", product.getId(), result.getImagesIndexed());
                } else {
                    failed++;
                    log.warn("Failed to index product {}", product.getId());
                }
            } catch (Exception e) {
                failed++;
                log.error("Error indexing product {}: {}", product.getId(), e.getMessage());
            }
        }

        log.info("Full sync complete: {} total, {} success, {} failed, {} skipped",
                total, success, failed, skipped);

        return ApiResponse.<Map<String, Object>>builder()
                .code(1000)
                .message("Index sync complete")
                .result(Map.of(
                        "total", total,
                        "success", success,
                        "failed", failed,
                        "skipped", skipped
                ))
                .build();
    }

    /**
     * Index a single product by ID
     */
    @PostMapping("/sync/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ImageIndexResponse> syncProduct(@PathVariable Long productId) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        List<String> imageUrls = aiImageSearchClient.collectImageUrls(
                product.getAvatar(),
                product.getImages(),
                product.getFirstImage()
        );

        if (imageUrls.isEmpty()) {
            return ApiResponse.<ImageIndexResponse>builder()
                    .code(1001)
                    .message("Product has no images to index")
                    .result(ImageIndexResponse.builder()
                            .productId(productId)
                            .imagesIndexed(0)
                            .imagesFailed(0)
                            .build())
                    .build();
        }

        ImageIndexResponse result = aiImageSearchClient.indexProduct(productId, imageUrls);

        return ApiResponse.<ImageIndexResponse>builder()
                .code(1000)
                .message("Product indexed successfully")
                .result(result)
                .build();
    }

    /**
     * Check AI service health
     */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> checkHealth() {
        boolean healthy = aiImageSearchClient.isHealthy();

        return ApiResponse.<Map<String, Object>>builder()
                .code(healthy ? 1000 : 1001)
                .message(healthy ? "AI service is healthy" : "AI service is not available")
                .result(Map.of("aiServiceHealthy", healthy))
                .build();
    }
}
