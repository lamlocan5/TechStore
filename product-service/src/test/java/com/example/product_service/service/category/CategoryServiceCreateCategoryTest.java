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
public class CategoryServiceCreateCategoryTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * TEST CASE ID: PRD_01
     */
    @Test
    @DisplayName("PRD_01: Tạo danh mục gốc (không có parentId) thành công")
    void PRD_01_createCategory_rootCategory_success() {
        // 1. INPUT
        CategoryRequest request = CategoryRequest.builder()
                .name("Electronics")
                .parentId(null)
                .build();

        // 2. GỌI HÀM
        CategoryResponse response = categoryService.createCategory(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("Electronics", response.getName());
        assertNull(response.getParentId());

        // Kiểm tra trong DB
        CategoryEntity saved = categoryRepository.findById(response.getId()).orElse(null);
        assertNotNull(saved);
        assertEquals("Electronics", saved.getName());
        assertNull(saved.getParent());
    }

    /**
     * TEST CASE ID: PRD_02
     */
    @Test
    @DisplayName("PRD_02: Tạo danh mục con (có parentId hợp lệ) thành công")
    void PRD_02_createCategory_subCategory_success() {
        // 1. INPUT
        // Tạo danh mục cha trước
        CategoryEntity parent = new CategoryEntity();
        parent.setName("Electronics");
        parent = categoryRepository.save(parent);

        CategoryRequest request = CategoryRequest.builder()
                .name("Laptops")
                .parentId(parent.getId())
                .build();

        // 2. GỌI HÀM
        CategoryResponse response = categoryService.createCategory(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("Laptops", response.getName());
        assertEquals(parent.getId(), response.getParentId());

        // Kiểm tra trong DB
        CategoryEntity saved = categoryRepository.findById(response.getId()).orElse(null);
        assertNotNull(saved);
        assertNotNull(saved.getParent());
        assertEquals(parent.getId(), saved.getParent().getId());
    }

    /**
     * TEST CASE ID: PRD_03
     */
    @Test
    @DisplayName("PRD_03: Tạo danh mục con thất bại (Parent không tồn tại)")
    void PRD_03_createCategory_parentNotFound_fail() {
        // 1. INPUT
        CategoryRequest request = CategoryRequest.builder()
                .name("Laptops")
                .parentId(999L) // ID không tồn tại
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            categoryService.createCategory(request);
        });
        assertEquals(ErrorCode.PARENT_CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_04
     */
    @Test
    @DisplayName("PRD_04: Tạo danh mục thất bại do tên rỗng")
    void PRD_04_createCategory_emptyName_fail() {
        // 1. INPUT
        CategoryRequest request = CategoryRequest.builder()
                .name("") // Tên rỗng
                .parentId(null)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        // Kỳ vọng hệ thống bắt lỗi (Throw Exception) vì tên không được để trống
        assertThrows(Exception.class, () -> {
            categoryService.createCategory(request);
        }, "LỖI HỆ THỐNG: Hệ thống đã tạo thành công danh mục có tên rỗng mà không văng ra lỗi!");
    }

    /**
     * TEST CASE ID: PRD_05
     */
    @Test
    @DisplayName("PRD_05: Tạo danh mục thất bại do tên đã tồn tại")
    void PRD_05_createCategory_duplicateName_fail() {
        // 1. INPUT
        CategoryEntity existing = new CategoryEntity();
        existing.setName("Smartphones");
        categoryRepository.saveAndFlush(existing);

        CategoryRequest request = CategoryRequest.builder()
                .name("Smartphones") // Trùng tên
                .parentId(null)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        // Kỳ vọng hệ thống bắt lỗi (Throw Exception) vì trùng tên danh mục
        assertThrows(Exception.class, () -> {
            categoryService.createCategory(request);
            categoryRepository.flush(); // Ép flush để xem DB có văng lỗi Constraints không
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo danh mục trùng tên mà không văng ra lỗi!");
    }
}
