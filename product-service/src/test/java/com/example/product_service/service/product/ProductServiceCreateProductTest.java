package com.example.product_service.service.product;

import com.example.product_service.dto.request.ProductRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.CategoryEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import com.example.product_service.repository.CategoryRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.service.AIImageSearchClient;
import com.example.product_service.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ProductServiceCreateProductTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @MockBean
    private AIImageSearchClient aiImageSearchClient;

    /**
     * TEST CASE ID: PRD_18
     */
    @Test
    @DisplayName("PRD_18: Tạo sản phẩm thành công với Category và Brand hợp lệ")
    void PRD_18_createProduct_validData_success() {
        // 1. INPUT
        CategoryEntity category = new CategoryEntity();
        category.setName("Category 1");
        category = categoryRepository.saveAndFlush(category);

        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductRequest request = ProductRequest.builder()
                .name("Valid Product")
                .brandId(brand.getId())
                .categoryIds(List.of(category.getId()))
                .priceSale(1000L)
                .status(true)
                .build();

        // 2. GỌI HÀM
        ProductResponse response = productService.createProduct(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("Valid Product", response.getName());
        assertEquals(brand.getId(), response.getBrandId());

        // Kiểm tra trong DB
        ProductEntity saved = productRepository.findById(response.getId()).orElse(null);
        assertNotNull(saved);
        assertEquals("Valid Product", saved.getName());
    }

    /**
     * TEST CASE ID: PRD_19
     */
    @Test
    @DisplayName("PRD_19: Tạo sản phẩm thất bại do Brand không tồn tại")
    void PRD_19_createProduct_brandNotFound_fail() {
        // 1. INPUT
        ProductRequest request = ProductRequest.builder()
                .name("Product No Brand")
                .brandId(999L)
                .categoryIds(List.of())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.createProduct(request);
        });
        assertEquals(ErrorCode.BRAND_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_20
     */
    @Test
    @DisplayName("PRD_20: Tạo sản phẩm thất bại do Category không tồn tại")
    void PRD_20_createProduct_categoryNotFound_fail() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductRequest request = ProductRequest.builder()
                .name("Product No Category")
                .brandId(brand.getId())
                .categoryIds(List.of(999L))
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.createProduct(request);
        });
        assertEquals(ErrorCode.CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_21
     */
    @Test
    @DisplayName("PRD_21: Tạo sản phẩm thất bại do tên rỗng")
    void PRD_21_createProduct_emptyName_fail() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductRequest request = ProductRequest.builder()
                .name("") // Tên rỗng
                .brandId(brand.getId())
                .categoryIds(List.of())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.createProduct(request);
            productRepository.flush(); // Bắt buộc flush để kiểm tra DB constraints
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo sản phẩm có tên rỗng mà không văng ra lỗi!");
    }

    /**
     * TEST CASE ID: PRD_22
     */
    @Test
    @DisplayName("PRD_22: Tạo sản phẩm thất bại do tên trùng")
    void PRD_22_createProduct_duplicateName_fail() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity existing = new ProductEntity();
        existing.setName("Duplicate Name");
        existing.setBrand(brand);
        existing.setStatus(true);
        productRepository.saveAndFlush(existing);

        ProductRequest request = ProductRequest.builder()
                .name("Duplicate Name") // Trùng tên
                .brandId(brand.getId())
                .categoryIds(List.of())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.createProduct(request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo sản phẩm trùng tên mà không văng ra lỗi!");
    }

    /**
     * TEST CASE ID: PRD_23
     */
    @Test
    @DisplayName("PRD_23: Tạo sản phẩm thất bại do bỏ trống giá bán")
    void PRD_23_createProduct_nullPrice_fail() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductRequest request = ProductRequest.builder()
                .name("No Price Product")
                .brandId(brand.getId())
                .categoryIds(List.of())
                .priceSale(null) // Giá bán rỗng
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.createProduct(request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo sản phẩm không có giá bán (null)!");
    }

    /**
     * TEST CASE ID: PRD_24
     */
    @Test
    @DisplayName("PRD_24: Tạo sản phẩm thất bại do giá bán âm")
    void PRD_24_createProduct_negativePrice_fail() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductRequest request = ProductRequest.builder()
                .name("Negative Price Product")
                .brandId(brand.getId())
                .categoryIds(List.of())
                .priceSale(-500L) // Giá bán âm
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.createProduct(request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo sản phẩm có giá bán âm!");
    }
}
