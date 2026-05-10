package com.example.product_service.service.category;

import com.example.product_service.dto.response.CategoryResponse;
import com.example.product_service.entity.CategoryEntity;
import com.example.product_service.repository.CategoryRepository;
import com.example.product_service.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CategoryServiceSearchByNameTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * TEST CASE ID: PRD_14
     */
    @Test
    @DisplayName("PRD_14: Tìm kiếm bằng tên trả về danh sách chứa từ khóa")
    void PRD_14_searchByName_found_success() {
        // 1. INPUT
        CategoryEntity entity1 = new CategoryEntity();
        entity1.setName("Laptop Gaming");
        categoryRepository.save(entity1);

        CategoryEntity entity2 = new CategoryEntity();
        entity2.setName("Laptop Office");
        categoryRepository.save(entity2);

        CategoryEntity entity3 = new CategoryEntity();
        entity3.setName("Smartphones");
        categoryRepository.save(entity3);

        String keyword = "laptop"; // Tìm kiếm không phân biệt hoa thường

        // 2. GỌI HÀM
        List<CategoryResponse> results = categoryService.searchByName(keyword);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.size() >= 2); // Ít nhất 2 kết quả vừa tạo
        
        // Kiểm tra xem tất cả kết quả trả về có chứa từ khóa không
        boolean allMatch = results.stream()
                .allMatch(cat -> cat.getName().toLowerCase().contains(keyword));
        assertTrue(allMatch, "Tất cả kết quả phải chứa từ khóa tìm kiếm");
    }

    /**
     * TEST CASE ID: PRD_15
     */
    @Test
    @DisplayName("PRD_15: Tìm kiếm bằng tên trả về danh sách rỗng (Không tìm thấy)")
    void PRD_15_searchByName_notFound_success() {
        // 1. INPUT
        String keyword = "ThisCategoryDoesNotExist12345";

        // 2. GỌI HÀM
        List<CategoryResponse> results = categoryService.searchByName(keyword);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.isEmpty(), "Danh sách kết quả phải rỗng");
    }
}
