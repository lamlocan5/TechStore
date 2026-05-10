package com.example.product_service.controller;


import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.CategoryRequest;
import com.example.product_service.dto.response.CategoryResponse;
import com.example.product_service.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CategoryResponse> create(@RequestBody CategoryRequest dto) {
        return ApiResponse.<CategoryResponse>builder()
                .message("Category created successfully")
                .result(categoryService.createCategory(dto))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CategoryResponse> update(@PathVariable Long id, @RequestBody CategoryRequest dto) {
        return ApiResponse.<CategoryResponse>builder()
                .message("Category updated successfully")
                .result(categoryService.updateCategory(id, dto))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.<Void>builder()
                .message("Category deleted successfully")
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PaginatedResponse<CategoryResponse>> search(
            @RequestParam String name,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<CategoryResponse> categoryPage = categoryService.searchByName(name, pageable);
        
        PaginatedResponse<CategoryResponse> paginatedResponse = PaginatedResponse.<CategoryResponse>builder()
                .result(categoryPage.getContent())
                .total(categoryPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(categoryPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<CategoryResponse>>builder()
                .message("Search results")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping
    public ApiResponse<PaginatedResponse<CategoryResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize); // page is 0-indexed in Spring
        Page<CategoryResponse> categoryPage;
        
        if (search != null && !search.trim().isEmpty()) {
            categoryPage = categoryService.searchByName(search, pageable);
        } else {
            categoryPage = categoryService.getAllCategories(pageable);
        }
        
        PaginatedResponse<CategoryResponse> paginatedResponse = PaginatedResponse.<CategoryResponse>builder()
                .result(categoryPage.getContent())
                .total(categoryPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(categoryPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<CategoryResponse>>builder()
                .message("Categories retrieved successfully")
                .result(paginatedResponse)
                .build();
    }
}