package com.example.identity_service.controller;

import com.example.identity_service.dto.request.ApiResponse;
import com.example.identity_service.dto.request.PermissionRequest;
import com.example.identity_service.dto.response.PaginatedResponse;
import com.example.identity_service.dto.response.PermissionResponse;
import com.example.identity_service.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PermissionController {
    PermissionService permissionService;

    @PostMapping
    ApiResponse<PermissionResponse> create(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<PaginatedResponse<PermissionResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<PermissionResponse> permissionPage = permissionService.getAll(pageable);
        
        PaginatedResponse<PermissionResponse> paginatedResponse = PaginatedResponse.<PermissionResponse>builder()
                .result(permissionPage.getContent())
                .total(permissionPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(permissionPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<PermissionResponse>>builder()
                .result(paginatedResponse)
                .build();
    }

    @DeleteMapping("/{permission}")
    ApiResponse<Void> delete(@PathVariable String permission) {
        permissionService.delete(permission);
        return ApiResponse.<Void>builder().build();
    }
}
