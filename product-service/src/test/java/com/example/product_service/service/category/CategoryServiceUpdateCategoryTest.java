package com.example.product_service.service.category;

import com.example.product_service.dto.request.CategoryRequest;
import com.example.product_service.dto.response.CategoryResponse;
import com.example.product_service.entity.CategoryEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.CategoryRepository;
import com.example.product_service.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CategoryServiceUpdateCategoryTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * TEST CASE ID: PRD_06
     */
    @Test
    @DisplayName("PRD_06: Cập nhật tên danh mục thành công")
    void PRD_06_updateCategory_validRequest_success() {
        // 1. INPUT
        CategoryEntity entity = new CategoryEntity();
        entity.setName("Old Name");
        CategoryEntity savedEntity = categoryRepository.save(entity);

        CategoryRequest request = CategoryRequest.builder()
                .name("New Name")
                .parentId(null)
                .build();

        // 2. GỌI HÀM
        CategoryResponse response = categoryService.updateCategory(savedEntity.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("New Name", response.getName());

        // Kiểm tra trong DB
        CategoryEntity updated = categoryRepository.findById(savedEntity.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals("New Name", updated.getName());
    }

    /**
     * TEST CASE ID: PRD_07
     */
    @Test
    @DisplayName("PRD_07: Cập nhật thất bại do ID danh mục không tồn tại")
    void PRD_07_updateCategory_notFound_fail() {
        // 1. INPUT
        CategoryRequest request = CategoryRequest.builder()
                .name("New Name")
                .parentId(null)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            categoryService.updateCategory(999L, request);
        });
        assertEquals(ErrorCode.CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_08
     */
    @Test
    @DisplayName("PRD_08: Cập nhật thất bại do Parent ID không tồn tại")
    void PRD_08_updateCategory_parentNotFound_fail() {
        // 1. INPUT
        CategoryEntity entity = new CategoryEntity();
        entity.setName("Electronics");
        CategoryEntity savedEntity = categoryRepository.save(entity);

        CategoryRequest request = CategoryRequest.builder()
                .name("Electronics Updated")
                .parentId(999L) // ID không tồn tại
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            categoryService.updateCategory(savedEntity.getId(), request);
        });
        assertEquals(ErrorCode.PARENT_CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_09
     */
    @Test
    @DisplayName("PRD_09: Cập nhật danh mục thất bại do tên rỗng")
    void PRD_09_updateCategory_emptyName_fail() {
        // 1. INPUT
        CategoryEntity entity = new CategoryEntity();
        entity.setName("Electronics");
        CategoryEntity savedEntity = categoryRepository.save(entity);

        CategoryRequest request = CategoryRequest.builder()
                .name("") // Tên rỗng
                .parentId(null)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            categoryService.updateCategory(savedEntity.getId(), request);
        }, "LỖI HỆ THỐNG: Hệ thống đã cho phép cập nhật tên danh mục thành rỗng mà không văng ra lỗi!");
    }

    /**
     * TEST CASE ID: PRD_10
     */
    @Test
    @DisplayName("PRD_10: Cập nhật danh mục thất bại do trùng tên với danh mục khác")
    void PRD_10_updateCategory_duplicateName_fail() {
        // 1. INPUT
        CategoryEntity existing1 = new CategoryEntity();
        existing1.setName("Laptops");
        categoryRepository.save(existing1);

        CategoryEntity existing2 = new CategoryEntity();
        existing2.setName("Smartphones");
        CategoryEntity savedExisting2 = categoryRepository.save(existing2);

        // Cố gắng đổi tên category 2 thành "Laptops" (đã tồn tại)
        CategoryRequest request = CategoryRequest.builder()
                .name("Laptops")
                .parentId(null)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            categoryService.updateCategory(savedExisting2.getId(), request);
            categoryRepository.flush(); // Ép flush để xem DB có văng lỗi Constraints không
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật danh mục trùng tên mà không văng ra lỗi!");
    }
}
