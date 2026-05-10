package com.example.product_service.service.variant;

import com.example.product_service.dto.response.VariantStatsResponse;
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
public class VariantServiceStatsTest {

    @Autowired
    private ProductVariantService variantService;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    /**
     * TEST CASE ID: PRD_57
     */
    @Test
    @DisplayName("PRD_57: Lấy thống kê tổng số lượng tồn kho thành công")
    void PRD_57_getStatistics_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity product = new ProductEntity();
        product.setName("Product 1");
        product.setBrand(brand);
        product.setStatus(true);
        product = productRepository.saveAndFlush(product);

        ProductVariantEntity v1 = new ProductVariantEntity();
        v1.setProduct(product);
        v1.setSku("SKU_STAT_01");
        v1.setStock(10);
        variantRepository.saveAndFlush(v1);

        ProductVariantEntity v2 = new ProductVariantEntity();
        v2.setProduct(product);
        v2.setSku("SKU_STAT_02");
        v2.setStock(25);
        variantRepository.saveAndFlush(v2);

        // 2. GỌI HÀM
        VariantStatsResponse response = variantService.getStatistics();

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertTrue(response.getTotalVariants() >= 2);
        assertTrue(response.getTotalStock() >= 35);
    }
}
