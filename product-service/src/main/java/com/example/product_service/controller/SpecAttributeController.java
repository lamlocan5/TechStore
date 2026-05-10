package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.PaginatedResponse;
import com.example.product_service.dto.request.SpecAttributeRequest;
import com.example.product_service.dto.response.SpecAttributeResponse;
import com.example.product_service.service.SpecAttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/spec-attributes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SpecAttributeController {

    private final SpecAttributeService service;

    @PostMapping
    public ApiResponse<SpecAttributeResponse> create(@RequestBody SpecAttributeRequest req) {
        return ApiResponse.<SpecAttributeResponse>builder()
                .message("Attribute created")
                .result(service.create(req))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SpecAttributeResponse> update(@PathVariable Long id, @RequestBody SpecAttributeRequest req) {
        return ApiResponse.<SpecAttributeResponse>builder()
                .message("Attribute updated")
                .result(service.update(id, req))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<Void>builder().message("Attribute deleted").build();
    }

    @GetMapping
    public ApiResponse<PaginatedResponse<SpecAttributeResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize); // Spring dùng page 0-based
        Page<SpecAttributeResponse> attributePage;
        
        if (search != null && !search.trim().isEmpty()) {
            attributePage = service.search(search, pageable);
        } else {
            attributePage = service.getAll(pageable);
        }
        
        PaginatedResponse<SpecAttributeResponse> paginatedResponse = PaginatedResponse.<SpecAttributeResponse>builder()
                .result(attributePage.getContent())
                .total(attributePage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(attributePage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<SpecAttributeResponse>>builder()
                .message("Attributes retrieved successfully")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<PaginatedResponse<SpecAttributeResponse>> search(
            @RequestParam String label,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<SpecAttributeResponse> attributePage = service.search(label, pageable);
        
        PaginatedResponse<SpecAttributeResponse> paginatedResponse = PaginatedResponse.<SpecAttributeResponse>builder()
                .result(attributePage.getContent())
                .total(attributePage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(attributePage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<SpecAttributeResponse>>builder()
                .message("Search results")
                .result(paginatedResponse)
                .build();
    }
}
