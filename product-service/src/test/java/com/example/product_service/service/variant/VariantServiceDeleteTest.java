package com.example.product_service.service.variant;

import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.entity.ProductVariantEntity;
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
public class VariantServiceDeleteTest {

    @Autowired
    private ProductVariantService variantService;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    /**
     * TEST CASE ID: PRD_47
     */
    @Test
    @DisplayName("PRD_47: Xóa biến thể thành công")
    void PRD_47_deleteVariant_success() {
        // 1. INPUT
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
        variant.setSku("SKU_DEL_01");
        variant = variantRepository.saveAndFlush(variant);
        Long variantId = variant.getId();

        // 2. GỌI HÀM
        variantService.delete(variantId);
        variantRepository.flush();

        // 3. EXPECTED OUTPUT
        assertFalse(variantRepository.existsById(variantId));
    }

    /**
     * TEST CASE ID: PRD_48
     */
    @Test
    @DisplayName("PRD_48: Xóa thất bại do ID biến thể không tồn tại")
    void PRD_48_deleteVariant_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            variantService.delete(invalidId);
            variantRepository.flush();
        }, "LỖI HỆ THỐNG: Cần ném ra lỗi khi người dùng xóa một ID không tồn tại!");
    }
}
