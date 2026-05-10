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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class VariantServiceGetTest {

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
     * TEST CASE ID: PRD_49
     */
    @Test
    @DisplayName("PRD_49: Xem chi tiết biến thể theo ID thành công")
    void PRD_49_getById_success() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantEntity variant = new ProductVariantEntity();
        variant.setProduct(product);
        variant.setSku("SKU_GET_01");
        variant.setStock(10);
        variant = variantRepository.saveAndFlush(variant);

        // 2. GỌI HÀM
        ProductVariantResponse response = variantService.getById(variant.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("SKU_GET_01", response.getSku());
    }

    /**
     * TEST CASE ID: PRD_50
     */
    @Test
    @DisplayName("PRD_50: Xem chi tiết thất bại do ID không tồn tại")
    void PRD_50_getById_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            variantService.getById(invalidId);
        });
        assertEquals(ErrorCode.PRODUCT_VARIANT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_51
     */
    @Test
    @DisplayName("PRD_51: Lấy danh sách biến thể theo productId thành công")
    void PRD_51_findByProduct_success() {
        // 1. INPUT
        ProductEntity product = createProduct();

        ProductVariantEntity v1 = new ProductVariantEntity();
        v1.setProduct(product);
        v1.setSku("SKU_GET_02");
        variantRepository.saveAndFlush(v1);

        ProductVariantEntity v2 = new ProductVariantEntity();
        v2.setProduct(product);
        v2.setSku("SKU_GET_03");
        variantRepository.saveAndFlush(v2);

        // 2. GỌI HÀM
        List<ProductVariantResponse> list = variantService.findByProduct(product.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(list);
        assertEquals(2, list.size());
    }
}
