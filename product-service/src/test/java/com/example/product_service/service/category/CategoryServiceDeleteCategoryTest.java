package com.example.product_service.service.category;

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
public class CategoryServiceDeleteCategoryTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * TEST CASE ID: PRD_11
     */
    @Test
    @DisplayName("PRD_11: Xóa danh mục thành công")
    void PRD_11_deleteCategory_validId_success() {
        // 1. INPUT
        CategoryEntity entity = new CategoryEntity();
        entity.setName("To Be Deleted");
        entity = categoryRepository.saveAndFlush(entity);
        Long id = entity.getId();

        // 2. GỌI HÀM
        categoryService.deleteCategory(id);

        // 3. EXPECTED OUTPUT
        assertFalse(categoryRepository.existsById(id));
    }

    /**
     * TEST CASE ID: PRD_12
     */
    @Test
    @DisplayName("PRD_12: Xóa thất bại do danh mục không tồn tại")
    void PRD_12_deleteCategory_notFound_fail() {
        // 1. INPUT
        Long id = 999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            categoryService.deleteCategory(id);
        });
        assertEquals(ErrorCode.CATEGORY_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRD_13
     */
    @Test
    @DisplayName("PRD_13: Xóa danh mục cha thì các danh mục con cũng bị xóa theo (Cascade Delete)")
    void PRD_13_deleteCategory_parent_cascadeDeleteChildren() {
        // 1. INPUT
        // Tạo danh mục cha
        CategoryEntity parent = new CategoryEntity();
        parent.setName("Parent Category");
        parent = categoryRepository.saveAndFlush(parent);

        // Tạo 2 danh mục con
        CategoryEntity child1 = new CategoryEntity();
        child1.setName("Child 1");
        child1.setParent(parent);
        child1 = categoryRepository.saveAndFlush(child1);

        CategoryEntity child2 = new CategoryEntity();
        child2.setName("Child 2");
        child2.setParent(parent);
        child2 = categoryRepository.saveAndFlush(child2);

        parent.setChildren(new java.util.ArrayList<>(java.util.Arrays.asList(child1, child2)));
        categoryRepository.saveAndFlush(parent);

        // 2. GỌI HÀM
        categoryService.deleteCategory(parent.getId());
        categoryRepository.flush(); // Ép thực thi lệnh xóa xuống DB để kiểm tra cascade

        // 3. EXPECTED OUTPUT
        assertFalse(categoryRepository.existsById(parent.getId()), "Danh mục cha phải bị xóa");
        assertFalse(categoryRepository.existsById(child1.getId()), "Danh mục con 1 phải bị xóa theo cha");
        assertFalse(categoryRepository.existsById(child2.getId()), "Danh mục con 2 phải bị xóa theo cha");
    }
}
