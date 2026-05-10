package com.example.product_service.service.variant;

import com.example.product_service.dto.request.ProductVariantRequest;
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
public class VariantServiceCreateTest {

    @Autowired
    private ProductVariantService variantService;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

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
     * TEST CASE ID: PRD_41
     */
    @Test
    @DisplayName("PRD_41: Tạo biến thể thành công với productId hợp lệ")
    void PRD_41_createVariant_validData_success() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(product.getId())
                .sku("SKU001")
                .color("Đen")
                .priceSale(1500L)
                .stock(10)
                .build();

        // 2. GỌI HÀM
        ProductVariantResponse response = variantService.create(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("SKU001", response.getSku());
        
        // Kiểm tra trong DB
        assertTrue(variantRepository.existsById(response.getId()));
    }

    /**
     * TEST CASE ID: PRD_42
     */
    @Test
    @DisplayName("PRD_42: Tạo biến thể thất bại do productId không tồn tại")
    void PRD_42_createVariant_productNotFound_fail() {
        // 1. INPUT
        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(999L)
                .sku("SKU002")
                .priceSale(1500L)
                .stock(10)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            variantService.create(request);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_43
     */
    @Test
    @DisplayName("PRD_43: Tạo biến thể thất bại do nhập SKU rỗng")
    void PRD_43_createVariant_emptySku_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(product.getId())
                .sku("") // SKU rỗng
                .priceSale(1500L)
                .stock(10)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            variantService.create(request);
            variantRepository.flush(); // Đẩy xuống DB để test constraint
        }, "LỖI HỆ THỐNG: Cần bắt lỗi khi người dùng nhập SKU rỗng!");
    }

    /**
     * TEST CASE ID: PRD_44
     */
    @Test
    @DisplayName("PRD_44: Tạo biến thể thất bại do trùng SKU")
    void PRD_44_createVariant_duplicateSku_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();

        // Tạo sẵn biến thể 1 có SKU005
        ProductVariantEntity existingVariant = new ProductVariantEntity();
        existingVariant.setProduct(product);
        existingVariant.setSku("SKU005");
        existingVariant.setStock(10);
        variantRepository.saveAndFlush(existingVariant);

        // Tạo request trùng SKU005
        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(product.getId())
                .sku("SKU005")
                .priceSale(1500L)
                .stock(10)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            variantService.create(request);
            variantRepository.flush(); // Cố tình đẩy xuống DB để kiểm tra Constraint
        }, "LỖI HỆ THỐNG: Cần bắt lỗi khi người dùng nhập trùng SKU!");
    }

    /**
     * TEST CASE ID: PRD_45
     */
    @Test
    @DisplayName("PRD_45: Tạo biến thể thất bại do giá bán âm")
    void PRD_45_createVariant_negativePrice_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(product.getId())
                .sku("SKU003")
                .priceSale(-500L) // Giá âm
                .stock(10)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            variantService.create(request);
            variantRepository.flush();
        }, "LỖI HỆ THỐNG: Cần bắt lỗi khi người dùng nhập giá bán âm!");
    }

    /**
     * TEST CASE ID: PRD_46
     */
    @Test
    @DisplayName("PRD_46: Tạo biến thể thất bại do số lượng tồn kho âm")
    void PRD_46_createVariant_negativeStock_fail() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantRequest request = ProductVariantRequest.builder()
                .productId(product.getId())
                .sku("SKU004")
                .priceSale(1500L)
                .stock(-5) // Tồn kho âm
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            variantService.create(request);
            variantRepository.flush();
        }, "LỖI HỆ THỐNG: Cần bắt lỗi khi người dùng nhập số lượng tồn kho âm!");
    }
}
