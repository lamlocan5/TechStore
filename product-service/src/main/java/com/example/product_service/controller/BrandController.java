package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.BrandRequest;
import com.example.product_service.dto.response.BrandResponse;
import com.example.product_service.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brands")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BrandController {

    private final BrandService brandService;

    @GetMapping("/{id}")
    public ApiResponse<BrandResponse> getBrandById(@PathVariable Long id) {
        return ApiResponse.<BrandResponse>builder()
                .message("Brand with id: " + id)
                .result(brandService.getBrandById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> create(@RequestBody BrandRequest request) {
        return ApiResponse.<BrandResponse>builder()
                .message("Brand created successfully")
                .result(brandService.createBrand(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> update(@PathVariable Long id, @RequestBody BrandRequest request) {
        return ApiResponse.<BrandResponse>builder()
                .message("Brand updated successfully")
                .result(brandService.updateBrand(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ApiResponse.<Void>builder()
                .message("Brand deleted successfully")
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PaginatedResponse<BrandResponse>> search(
            @RequestParam String name,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<BrandResponse> brandPage = brandService.searchByName(name, pageable);
        
        PaginatedResponse<BrandResponse> paginatedResponse = PaginatedResponse.<BrandResponse>builder()
                .result(brandPage.getContent())
                .total(brandPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(brandPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<BrandResponse>>builder()
                .message("Search results")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping
    public ApiResponse<PaginatedResponse<BrandResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<BrandResponse> brandPage = brandService.getAllBrands(pageable);
        
        PaginatedResponse<BrandResponse> paginatedResponse = PaginatedResponse.<BrandResponse>builder()
                .result(brandPage.getContent())
                .total(brandPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(brandPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<BrandResponse>>builder()
                .message("All brands")
                .result(paginatedResponse)
                .build();
    }
}
