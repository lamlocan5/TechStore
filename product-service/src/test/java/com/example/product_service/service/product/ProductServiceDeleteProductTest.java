package com.example.product_service.service.product;

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
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ProductServiceDeleteProductTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    @MockBean
    private AIImageSearchClient aiImageSearchClient;

    /**
     * TEST CASE ID: PRD_33
     */
    @Test
    @DisplayName("PRD_33: Xóa sản phẩm thành công theo ID")
    void PRD_33_deleteProduct_validId_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity product = new ProductEntity();
        product.setName("Product To Delete");
        product.setBrand(brand);
        product.setStatus(true);
        product = productRepository.saveAndFlush(product);

        Long productId = product.getId();

        // 2. GỌI HÀM
        productService.deleteProduct(productId);
        productRepository.flush(); // Cập nhật trạng thái xóa xuống DB

        // 3. EXPECTED OUTPUT
        assertFalse(productRepository.existsById(productId)); // Kiểm tra trong DB xem bản ghi còn không
    }

    /**
     * TEST CASE ID: PRD_34
     */
    @Test
    @DisplayName("PRD_34: Xóa thất bại do ID sản phẩm không tồn tại")
    void PRD_34_deleteProduct_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            productService.deleteProduct(invalidId);
        });
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, exception.getErrorCode());
    }
}
