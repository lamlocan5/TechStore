package com.example.product_service.service.category;

import com.example.product_service.dto.response.CategoryResponse;
import com.example.product_service.entity.CategoryEntity;
import com.example.product_service.repository.CategoryRepository;
import com.example.product_service.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CategoryServiceGetAllCategoriesTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * TEST CASE ID: PRD_16
     */
    @Test
    @DisplayName("PRD_16: Lấy toàn bộ danh sách danh mục (List)")
    void PRD_16_getAllCategories_list_success() {
        // 1. INPUT
        CategoryEntity entity1 = new CategoryEntity();
        entity1.setName("Category 1");
        categoryRepository.save(entity1);

        CategoryEntity entity2 = new CategoryEntity();
        entity2.setName("Category 2");
        categoryRepository.save(entity2);

        // 2. GỌI HÀM
        List<CategoryResponse> results = categoryService.getAllCategories();

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.size() >= 2); // Ít nhất 2 kết quả vừa tạo
    }

    /**
     * TEST CASE ID: PRD_17
     */
    @Test
    @DisplayName("PRD_17: Lấy danh sách danh mục có phân trang (Pageable)")
    void PRD_17_getAllCategories_pageable_success() {
        // 1. INPUT
        // Thêm 3 danh mục để test phân trang
        for (int i = 0; i < 3; i++) {
            CategoryEntity entity = new CategoryEntity();
            entity.setName("Paged Category " + i);
            categoryRepository.save(entity);
        }

        PageRequest pageRequest = PageRequest.of(0, 2); // Lấy trang 0, kích thước 2

        // 2. GỌI HÀM
        Page<CategoryResponse> results = categoryService.getAllCategories(pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(2, results.getSize(), "Kích thước trang phải là 2");
        assertTrue(results.getTotalElements() >= 3, "Tổng số phần tử phải lớn hơn hoặc bằng 3");
        assertNotNull(results.getContent());
    }
}
