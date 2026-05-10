package com.example.product_service.service.variant;

import com.example.product_service.dto.response.ProductVariantResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.entity.ProductVariantEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.repository.ProductVariantRepository;
import com.example.product_service.service.ProductVariantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class VariantServiceStockTest {

    @Autowired
    private ProductVariantService variantService;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    private ProductVariantEntity createVariant(int stock) {
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity product = new ProductEntity();
        product.setName("Product 1");
        product.setBrand(brand);
        product.setStatus(true);
        product = productRepository.saveAndFlush(product);

        ProductVariantEntity variant = new ProductVariantEntity();
        variant.setProduct(product);
        variant.setSku("SKU_STOCK");
        variant.setStock(stock);
        return variantRepository.saveAndFlush(variant);
    }

    /**
     * TEST CASE ID: PRD_52
     */
    @Test
    @DisplayName("PRD_52: Cộng tồn kho (addStock) thành công")
    void PRD_52_addStock_success() {
        // 1. INPUT
        ProductVariantEntity variant = createVariant(10); // Ban đầu có 10

        // 2. GỌI HÀM
        ProductVariantResponse response = variantService.addStock(variant.getId(), 5); // Thêm 5

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(15, response.getStock());
    }

    /**
     * TEST CASE ID: PRD_53
     */
    @Test
    @DisplayName("PRD_53: Cộng tồn kho thất bại do số lượng <= 0")
    void PRD_53_addStock_invalidQuantity_fail() {
        // 1. INPUT
        ProductVariantEntity variant = createVariant(10);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            variantService.addStock(variant.getId(), 0);
        });
        assertEquals(ErrorCode.INVALID_STOCK_QUANTITY, exception.getErrorCode());
        
        AppException exception2 = assertThrows(AppException.class, () -> {
            variantService.addStock(variant.getId(), -5);
        });
        assertEquals(ErrorCode.INVALID_STOCK_QUANTITY, exception2.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_54
     */
    @Test
    @DisplayName("PRD_54: Trừ tồn kho (reduceStock) thành công")
    void PRD_54_reduceStock_success() {
        // 1. INPUT
        ProductVariantEntity variant = createVariant(20); // Ban đầu có 20

        // 2. GỌI HÀM
        ProductVariantResponse response = variantService.reduceStock(variant.getId(), 5); // Trừ đi 5

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(15, response.getStock());
    }

    /**
     * TEST CASE ID: PRD_55
     */
    @Test
    @DisplayName("PRD_55: Trừ tồn kho thất bại do số lượng <= 0")
    void PRD_55_reduceStock_invalidQuantity_fail() {
        // 1. INPUT
        ProductVariantEntity variant = createVariant(20);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            variantService.reduceStock(variant.getId(), 0);
        });
        assertEquals(ErrorCode.INVALID_STOCK_QUANTITY, exception.getErrorCode());

        AppException exception2 = assertThrows(AppException.class, () -> {
            variantService.reduceStock(variant.getId(), -5);
        });
        assertEquals(ErrorCode.INVALID_STOCK_QUANTITY, exception2.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_56
     */
    @Test
    @DisplayName("PRD_56: Trừ tồn kho thất bại do không đủ hàng trong kho")
    void PRD_56_reduceStock_insufficientStock_fail() {
        // 1. INPUT
        ProductVariantEntity variant = createVariant(5); // Chỉ có 5

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            variantService.reduceStock(variant.getId(), 10); // Đòi trừ 10
        });
        assertEquals(ErrorCode.INSUFFICIENT_STOCK, exception.getErrorCode());
    }
}
