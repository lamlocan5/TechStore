package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.ProductRequest;
import com.example.product_service.dto.request.ProductSearchRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> create(@RequestBody ProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .message("Product created successfully")
                .result(productService.createProduct(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> update(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .message("Product updated successfully")
                .result(productService.updateProduct(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.<Void>builder()
                .message("Product deleted successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.<ProductResponse>builder()
                .message("Product details")
                .result(productService.getProductById(id))
                .build();
    }

    @GetMapping("/batch")
    public ApiResponse<List<ProductResponse>> getByIds(@RequestParam List<Long> ids) {
        return ApiResponse.<List<ProductResponse>>builder()
                .message("Products retrieved successfully")
                .result(productService.getProductsByIds(ids))
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PaginatedResponse<ProductResponse>> search(
            @RequestParam String name,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ProductResponse> productPage = productService.searchByName(name, pageable);
        
        PaginatedResponse<ProductResponse> paginatedResponse = PaginatedResponse.<ProductResponse>builder()
                .result(productPage.getContent())
                .total(productPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(productPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                .message("Search results")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/brand/{brandId}")
    public ApiResponse<PaginatedResponse<ProductResponse>> getByBrand(
            @PathVariable Long brandId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {

        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ProductResponse> productPage = productService.getProductsByBrand(brandId, pageable);

        PaginatedResponse<ProductResponse> paginatedResponse = PaginatedResponse.<ProductResponse>builder()
                .result(productPage.getContent())
                .total(productPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(productPage.getTotalPages())
                .build();

        return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                .message("Products by brand")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping
    public ApiResponse<PaginatedResponse<ProductResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize); // page is 0-indexed in Spring
        Page<ProductResponse> productPage;
        
        // Use paginated search or paginated getAll - always optimized
        if (search != null && !search.trim().isEmpty()) {
            productPage = productService.searchByName(search, pageable);
        } else {
            productPage = productService.getAllProducts(pageable);
        }
        
        PaginatedResponse<ProductResponse> paginatedResponse = PaginatedResponse.<ProductResponse>builder()
                .result(productPage.getContent())
                .total(productPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(productPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                .message("Products retrieved successfully")
                .result(paginatedResponse)
                .build();
    }

    /**
     * Advanced search với filters: keyword (fuzzy search), price range, brand, category
     * - Fuzzy search: "macbok" sẽ tìm được "macbook"
     * - Có thể có cả nhiều điều kiện (price + brand + category) hoặc không có điều kiện nào
     * - Có phân trang
     * - categoryId: filter theo danh mục sản phẩm (laptop, điện thoại, etc.)
     */
    @GetMapping("/search/advanced")
    public ApiResponse<PaginatedResponse<ProductResponse>> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {

        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ProductResponse> productPage = productService.searchProductsWithCategory(
                keyword,
                minPrice,
                maxPrice,
                brandId,
                categoryId,
                pageable
        );

        PaginatedResponse<ProductResponse> paginatedResponse = PaginatedResponse.<ProductResponse>builder()
                .result(productPage.getContent())
                .total(productPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(productPage.getTotalPages())
                .build();

        return ApiResponse.<PaginatedResponse<ProductResponse>>builder()
                .message("Search results")
                .result(paginatedResponse)
                .build();
    }
}
