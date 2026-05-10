package com.example.product_service.service.product;

import com.example.product_service.dto.request.ProductRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.entity.BrandEntity;
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
public class ProductServiceUpdateProductTest {

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

    private BrandEntity createBrand(String name) {
        BrandEntity brand = new BrandEntity();
        brand.setName(name);
        return brandRepository.saveAndFlush(brand);
    }

    private ProductEntity createProduct(String name, BrandEntity brand) {
        ProductEntity entity = new ProductEntity();
        entity.setName(name);
        entity.setBrand(brand);
        entity.setStatus(true);
        return productRepository.saveAndFlush(entity);
    }

    /**
     * TEST CASE ID: PRD_25
     */
    @Test
    @DisplayName("PRD_25: Cập nhật thông tin sản phẩm thành công")
    void PRD_25_updateProduct_validData_success() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand Old");
        ProductEntity product = createProduct("Old Name", brand);

        BrandEntity newBrand = createBrand("Brand New");

        ProductRequest request = ProductRequest.builder()
                .name("New Name")
                .brandId(newBrand.getId())
                .categoryIds(List.of())
                .priceSale(2000L)
                .status(true)
                .build();

        // 2. GỌI HÀM
        ProductResponse response = productService.updateProduct(product.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("New Name", response.getName());
        assertEquals(newBrand.getId(), response.getBrandId());

        // Kiểm tra trong DB
        ProductEntity updated = productRepository.findById(product.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals("New Name", updated.getName());
    }

    /**
     * TEST CASE ID: PRD_26
     */
    @Test
    @DisplayName("PRD_26: Cập nhật thất bại do ID sản phẩm không tồn tại")
    void PRD_26_updateProduct_notFound_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductRequest request = ProductRequest.builder()
                .name("New Name")
                .brandId(brand.getId())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.updateProduct(999L, request);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_27
     */
    @Test
    @DisplayName("PRD_27: Cập nhật thất bại do Brand ID mới không tồn tại")
    void PRD_27_updateProduct_brandNotFound_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product = createProduct("Product 1", brand);

        ProductRequest request = ProductRequest.builder()
                .name("New Name")
                .brandId(999L)
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.updateProduct(product.getId(), request);
        });
        assertEquals(ErrorCode.BRAND_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_28
     */
    @Test
    @DisplayName("PRD_28: Cập nhật thất bại do Category ID mới không tồn tại")
    void PRD_28_updateProduct_categoryNotFound_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product = createProduct("Product 1", brand);

        ProductRequest request = ProductRequest.builder()
                .name("New Name")
                .brandId(brand.getId())
                .categoryIds(List.of(999L))
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.updateProduct(product.getId(), request);
        });
        assertEquals(ErrorCode.CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_29
     */
    @Test
    @DisplayName("PRD_29: Cập nhật thất bại do tên để rỗng")
    void PRD_29_updateProduct_emptyName_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product = createProduct("Product 1", brand);

        ProductRequest request = ProductRequest.builder()
                .name("") // Tên rỗng
                .brandId(brand.getId())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.updateProduct(product.getId(), request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật tên sản phẩm thành rỗng!");
    }

    /**
     * TEST CASE ID: PRD_30
     */
    @Test
    @DisplayName("PRD_30: Cập nhật thất bại do tên trùng với sản phẩm khác đã tồn tại")
    void PRD_30_updateProduct_duplicateName_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product1 = createProduct("Product 1", brand);
        ProductEntity product2 = createProduct("Product 2", brand);

        ProductRequest request = ProductRequest.builder()
                .name("Product 1") // Cố tình đổi tên product 2 thành tên của product 1
                .brandId(brand.getId())
                .priceSale(1000L)
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.updateProduct(product2.getId(), request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật trùng tên với sản phẩm khác!");
    }

    /**
     * TEST CASE ID: PRD_31
     */
    @Test
    @DisplayName("PRD_31: Cập nhật thất bại do bỏ trống giá bán")
    void PRD_31_updateProduct_nullPrice_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product = createProduct("Product 1", brand);

        ProductRequest request = ProductRequest.builder()
                .name("Product Updated")
                .brandId(brand.getId())
                .priceSale(null) // Bỏ trống giá
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.updateProduct(product.getId(), request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật giá bán thành null!");
    }

    /**
     * TEST CASE ID: PRD_32
     */
    @Test
    @DisplayName("PRD_32: Cập nhật thất bại do giá bán không hợp lệ (giá âm)")
    void PRD_32_updateProduct_negativePrice_fail() {
        // 1. INPUT
        BrandEntity brand = createBrand("Brand 1");
        ProductEntity product = createProduct("Product 1", brand);

        ProductRequest request = ProductRequest.builder()
                .name("Product Updated")
                .brandId(brand.getId())
                .priceSale(-1000L) // Giá âm
                .status(true)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            productService.updateProduct(product.getId(), request);
            productRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật giá bán âm!");
    }
}
