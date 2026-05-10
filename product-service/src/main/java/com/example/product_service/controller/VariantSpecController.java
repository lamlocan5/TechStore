package com.example.product_service.controller;

import com.example.product_service.dto.ApiResponse;
import com.example.product_service.dto.request.VariantSpecRequest;
import com.example.product_service.dto.response.VariantSpecResponse;
import com.example.product_service.service.VariantSpecService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/variant-specs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VariantSpecController {

    private final VariantSpecService service;

    /**
     * Tạo mới một thông số (spec) cho biến thể sản phẩm
     */
    @PostMapping
    public ApiResponse<VariantSpecResponse> create(@RequestBody VariantSpecRequest req) {
        return ApiResponse.<VariantSpecResponse>builder()
                .message("Variant spec created successfully")
                .result(service.create(req))
                .build();
    }

    /**
     * Xóa một thông số theo ID
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.<Void>builder()
                .message("Variant spec deleted successfully")
                .build();
    }

    /**
     * Lấy danh sách tất cả thông số theo id variant
     */
    @GetMapping("/variant/{variantId}")
    public ApiResponse<List<VariantSpecResponse>> findByVariant(@PathVariable Long variantId) {
        return ApiResponse.<List<VariantSpecResponse>>builder()
                .message("Variant specs fetched successfully")
                .result(service.findByVariant(variantId))
                .build();
    }
}
