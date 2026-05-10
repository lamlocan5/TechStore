package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.ProductVariantRequest;
import com.example.product_service.dto.request.StockUpdateRequest;
import com.example.product_service.dto.response.ProductVariantResponse;
import com.example.product_service.dto.response.VariantStatsResponse;
import com.example.product_service.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/variants")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService service;

    @PostMapping
    public ApiResponse<ProductVariantResponse> create(@RequestBody ProductVariantRequest req) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Variant created successfully")
                .result(service.create(req))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductVariantResponse> update(@PathVariable Long id, @RequestBody ProductVariantRequest req) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Variant updated successfully")
                .result(service.update(id, req))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<Void>builder().message("Variant deleted").build();
    }

    @GetMapping
    public ApiResponse<PaginatedResponse<ProductVariantResponse>> all(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ProductVariantResponse> variantPage = service.findAll(pageable);
        
        PaginatedResponse<ProductVariantResponse> paginatedResponse = PaginatedResponse.<ProductVariantResponse>builder()
                .result(variantPage.getContent())
                .total(variantPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(variantPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<ProductVariantResponse>>builder()
                .message("All variants")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/product/{productId}")
    public ApiResponse<List<ProductVariantResponse>> byProduct(@PathVariable Long productId) {
        return ApiResponse.<List<ProductVariantResponse>>builder()
                .message("Variants by product")
                .result(service.findByProduct(productId))
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PaginatedResponse<ProductVariantResponse>> search(
            @RequestParam String sku,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<ProductVariantResponse> variantPage = service.searchBySku(sku, pageable);
        
        PaginatedResponse<ProductVariantResponse> paginatedResponse = PaginatedResponse.<ProductVariantResponse>builder()
                .result(variantPage.getContent())
                .total(variantPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(variantPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<ProductVariantResponse>>builder()
                .message("Search result")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductVariantResponse> getById(@PathVariable Long id) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Variant details")
                .result(service.getById(id))
                .build();
    }

    @PostMapping("/{id}/stock/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> addStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Stock added successfully")
                .result(service.addStock(id, request.getQuantity()))
                .build();
    }

    @PostMapping("/{id}/stock/reduce")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> reduceStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Stock reduced successfully")
                .result(service.reduceStock(id, request.getQuantity()))
                .build();
    }

    @PutMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> setStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Stock updated successfully")
                .result(service.setStock(id, request.getQuantity()))
                .build();
    }

    // Internal endpoints for service-to-service communication (no authentication required)
    @PostMapping("/internal/{id}/stock/reduce")
    public ApiResponse<ProductVariantResponse> internalReduceStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Stock reduced successfully")
                .result(service.reduceStock(id, request.getQuantity()))
                .build();
    }

    @PostMapping("/internal/{id}/stock/add")
    public ApiResponse<ProductVariantResponse> internalAddStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .message("Stock added successfully")
                .result(service.addStock(id, request.getQuantity()))
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<VariantStatsResponse> getStatistics() {
        return ApiResponse.<VariantStatsResponse>builder()
                .message("Variant statistics")
                .result(service.getStatistics())
                .build();
    }
}
