package com.example.product_service.service.product;

import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.CategoryEntity;
import com.example.product_service.entity.ProductEntity;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ProductServiceSearchProductTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @MockBean
    private AIImageSearchClient aiImageSearchClient;

    /**
     * TEST CASE ID: PRD_38
     */
    @Test
    @DisplayName("PRD_38: Tìm kiếm danh sách theo từ khoá gần đúng (Có trả về kết quả)")
    void PRD_38_searchByName_found_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        ProductEntity p1 = new ProductEntity();
        p1.setName("Macbook Pro 2021");
        p1.setBrand(brand);
        p1.setStatus(true);
        productRepository.saveAndFlush(p1);

        ProductEntity p2 = new ProductEntity();
        p2.setName("Laptop Gaming");
        p2.setBrand(brand);
        p2.setStatus(true);
        productRepository.saveAndFlush(p2);

        String keyword = "Macbook";

        // 2. GỌI HÀM
        List<ProductResponse> exactResults = productService.searchByName(keyword);
        
        // 3. EXPECTED OUTPUT
        assertNotNull(exactResults);
        assertFalse(exactResults.isEmpty());
        assertTrue(exactResults.get(0).getName().toLowerCase().contains("mac"));
    }

    /**
     * TEST CASE ID: PRD_39
     */
    @Test
    @DisplayName("PRD_39: Tìm kiếm với từ khoá sai thì danh sách trả về rỗng")
    void PRD_39_searchByName_notFound_success() {
        // 1. INPUT
        String wrongKeyword = "ThisProductDoesNotExist12345";

        // 2. GỌI HÀM
        List<ProductResponse> results = productService.searchByName(wrongKeyword);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    /**
     * TEST CASE ID: PRD_40
     */
    @Test
    @DisplayName("PRD_40: Tìm kiếm kết hợp thêm filter categoryId")
    void PRD_40_searchProductsWithCategory_success() {
        // 1. INPUT
        BrandEntity brand = new BrandEntity();
        brand.setName("Brand 1");
        brand = brandRepository.saveAndFlush(brand);

        CategoryEntity category = new CategoryEntity();
        category.setName("Category 1");
        category = categoryRepository.saveAndFlush(category);

        ProductEntity p1 = new ProductEntity();
        p1.setName("Macbook Air");
        p1.setBrand(brand);
        p1.setCategories(List.of(category));
        p1.setStatus(true);
        productRepository.saveAndFlush(p1);

        PageRequest pageRequest = PageRequest.of(0, 10);
        
        // 2. GỌI HÀM
        Page<ProductResponse> results = productService.searchProductsWithCategory(
                "Macbook", null, null, brand.getId(), category.getId(), pageRequest
        );

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertFalse(results.isEmpty());
        assertEquals("Macbook Air", results.getContent().get(0).getName());
    }
}
