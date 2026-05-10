package com.example.product_service.service.product;

import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.service.AIImageSearchClient;
import com.example.product_service.service.ProductService;
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
public class ProductServiceGetProductTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    @MockBean
    private AIImageSearchClient aiImageSearchClient;

    /**
     * TEST CASE ID: PRD_35
     */
    @Test
    @DisplayName("PRD_35: Xem chi tiết sản phẩm thành công")
    void PRD_35_getProductById_validId_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity product = new ProductEntity();
        product.setName("Product 1");
        product.setBrand(brand);
        product.setStatus(true);
        product = productRepository.saveAndFlush(product);

        // 2. GỌI HÀM
        ProductResponse response = productService.getProductById(product.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("Product 1", response.getName());
    }

    /**
     * TEST CASE ID: PRD_36
     */
    @Test
    @DisplayName("PRD_36: Xem chi tiết thất bại do ID không tồn tại")
    void PRD_36_getProductById_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.getProductById(invalidId);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_37
     */
    @Test
    @DisplayName("PRD_37: Lấy toàn bộ danh sách phân trang thành công")
    void PRD_37_getAllProducts_pageable_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        for (int i = 0; i < 3; i++) {
            ProductEntity product = new ProductEntity();
            product.setName("Product " + i);
            product.setBrand(brand);
            product.setStatus(true);
            productRepository.saveAndFlush(product);
        }

        PageRequest pageRequest = PageRequest.of(0, 2);
        
        // 2. GỌI HÀM
        Page<ProductResponse> results = productService.getAllProducts(pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(2, results.getSize());
        assertTrue(results.getTotalElements() >= 3);
        assertNotNull(results.getContent());
    }
}
