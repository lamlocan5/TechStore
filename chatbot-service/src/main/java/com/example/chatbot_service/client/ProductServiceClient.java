package com.example.chatbot_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "product-service", url = "${app.service.product}")
public interface ProductServiceClient {

    @GetMapping("/product/products")
    Map<String, Object> searchProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int limit
    );

    /**
     * Advanced search với filters: keyword, price range, brand, category
     * Sử dụng cho chatbot tìm kiếm theo category (laptop, điện thoại, etc.)
     */
    @GetMapping("/product/products/search/advanced")
    Map<String, Object> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int limit
    );

    @GetMapping("/product/products/{id}")
    Map<String, Object> getProductById(@PathVariable Long id);

    @GetMapping("/product/variants/product/{productId}")
    Map<String, Object> getVariantsByProductId(@PathVariable Long productId);

    @GetMapping("/product/brands")
    Map<String, Object> getBrands(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "100") int limit
    );

    @GetMapping("/product/categories")
    Map<String, Object> getCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "100") int limit
    );
}
