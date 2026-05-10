package com.example.order_service.controller;

import com.example.order_service.dto.ApiResponse;
import com.example.order_service.dto.request.OrderStatusRequest;
import com.example.order_service.dto.response.OrderStatusResponse;
import com.example.order_service.service.OrderStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order-statuses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderStatusController {

    private final OrderStatusService orderStatusService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<OrderStatusResponse>> getAll() {
        return ApiResponse.<List<OrderStatusResponse>>builder()
                .message("All order statuses")
                .result(orderStatusService.getAll())
                .build();
    }

    @GetMapping("/active")
    public ApiResponse<List<OrderStatusResponse>> getActive() {
        return ApiResponse.<List<OrderStatusResponse>>builder()
                .message("Active order statuses")
                .result(orderStatusService.getActive())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderStatusResponse> getById(@PathVariable Long id) {
        return ApiResponse.<OrderStatusResponse>builder()
                .message("Order status details")
                .result(orderStatusService.getById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderStatusResponse> create(@RequestBody OrderStatusRequest request) {
        return ApiResponse.<OrderStatusResponse>builder()
                .message("Order status created successfully")
                .result(orderStatusService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderStatusResponse> update(@PathVariable Long id, @RequestBody OrderStatusRequest request) {
        return ApiResponse.<OrderStatusResponse>builder()
                .message("Order status updated successfully")
                .result(orderStatusService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        orderStatusService.delete(id);
        return ApiResponse.<Void>builder()
                .message("Order status deleted successfully")
                .build();
    }
}

