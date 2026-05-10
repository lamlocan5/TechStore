package com.example.order_service.controller;

import com.example.order_service.dto.ApiResponse;
import com.example.order_service.dto.PaginatedResponse;
import com.example.order_service.dto.request.OrderRequest;
import com.example.order_service.dto.response.OrderResponse;
import com.example.order_service.dto.response.SalesStatisticsResponse;
import com.example.order_service.dto.response.VariantSoldDataResponse;
import com.example.order_service.dto.response.RevenueStatisticsResponse;
import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.OrderType;
import com.example.order_service.enums.PaymentStatus;
import com.example.order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    private String getAuthenticatedUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    public ApiResponse<OrderResponse> create(@RequestBody OrderRequest request) {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<OrderResponse>builder()
                .message("Order created successfully")
                .result(orderService.createOrder(userId, request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getById(@PathVariable Long id) {
        return ApiResponse.<OrderResponse>builder()
                .message("Order details")
                .result(orderService.getOrderById(id))
                .build();
    }

    @GetMapping("/internal/{id}")
    public ApiResponse<OrderResponse> getByIdInternal(@PathVariable Long id) {
        return ApiResponse.<OrderResponse>builder()
                .message("Order details")
                .result(orderService.getOrderById(id))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaginatedResponse<OrderResponse>> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getAllOrders(pageable);
        
        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("All orders")
                .result(paginatedResponse)
                .build();
    }
    
    @GetMapping("/my-orders")
    public ApiResponse<PaginatedResponse<OrderResponse>> getMyOrders(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        String userId = getAuthenticatedUserId();
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getOrdersByUserId(userId, pageable);
        
        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("My orders")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<PaginatedResponse<OrderResponse>> getByUserId(
            @PathVariable String userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getOrdersByUserId(userId, pageable);
        
        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("User orders")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/status/{status}")
    public ApiResponse<PaginatedResponse<OrderResponse>> getByStatus(
            @PathVariable OrderStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getOrdersByStatus(status, pageable);
        
        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("Orders by status")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/type/{orderType}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaginatedResponse<OrderResponse>> getByOrderType(
            @PathVariable OrderType orderType,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {

        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getOrdersByType(orderType, pageable);

        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();

        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("Orders by type")
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/user/{userId}/status/{status}")
    public ApiResponse<PaginatedResponse<OrderResponse>> getByUserIdAndStatus(
            @PathVariable String userId,
            @PathVariable OrderStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orderPage = orderService.getOrdersByUserIdAndStatus(userId, status, pageable);
        
        PaginatedResponse<OrderResponse> paginatedResponse = PaginatedResponse.<OrderResponse>builder()
                .result(orderPage.getContent())
                .total(orderPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(orderPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<OrderResponse>>builder()
                .message("User orders by status")
                .result(paginatedResponse)
                .build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        return ApiResponse.<OrderResponse>builder()
                .message("Order status updated")
                .result(orderService.updateOrderStatus(id, status))
                .build();
    }

    @PutMapping("/{id}/payment-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam PaymentStatus status) {
        return ApiResponse.<OrderResponse>builder()
                .message("Payment status updated")
                .result(orderService.updatePaymentStatus(id, status))
                .build();
    }

    /**
     * Internal endpoint for payment service to update payment status
     * Không yêu cầu authentication (chỉ dùng cho service-to-service calls)
     */
    @PutMapping("/internal/{id}/payment-status")
    public ApiResponse<OrderResponse> updatePaymentStatusInternal(
            @PathVariable Long id,
            @RequestParam PaymentStatus status) {
        return ApiResponse.<OrderResponse>builder()
                .message("Payment status updated")
                .result(orderService.updatePaymentStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(@PathVariable Long id) {
        orderService.cancelOrder(id);
        return ApiResponse.<Void>builder()
                .message("Order cancelled successfully")
                .build();
    }

    @GetMapping("/statistics/sales")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SalesStatisticsResponse> getSalesStatistics() {
        SalesStatisticsResponse statistics = orderService.getSalesStatistics();
        return ApiResponse.<SalesStatisticsResponse>builder()
                .message("Sales statistics")
                .result(statistics)
                .build();
    }

    @GetMapping("/statistics/variant-sold")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<VariantSoldDataResponse> getVariantSoldData() {
        VariantSoldDataResponse soldData = orderService.getVariantSoldData();
        return ApiResponse.<VariantSoldDataResponse>builder()
                .message("Variant sold data")
                .result(soldData)
                .build();
    }

    @GetMapping("/revenue-statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<RevenueStatisticsResponse> getRevenueStatistics(
            @RequestParam String period,      // "month", "quarter", "year"
            @RequestParam int year,            // 2024, 2025, etc.
            @RequestParam(required = false) Integer month) {  // 1-12 (only for period=month)
        RevenueStatisticsResponse statistics = orderService.getRevenueStatistics(period, year, month);
        return ApiResponse.<RevenueStatisticsResponse>builder()
                .message("Revenue statistics")
                .result(statistics)
                .build();
    }

    /**
     * Internal endpoint để kiểm tra user đã mua sản phẩm chưa
     * Không yêu cầu authentication (chỉ dùng cho service-to-service calls)
     * @param userId ID của user
     * @param productId ID của sản phẩm
     * @return Map với key "hasPurchased" (boolean)
     */
    @GetMapping("/internal/check-purchase")
    public ApiResponse<Map<String, Boolean>> checkPurchase(
            @RequestParam String userId,
            @RequestParam Long productId) {
        boolean hasPurchased = orderService.hasUserPurchasedProduct(userId, productId);
        Map<String, Boolean> result = Map.of("hasPurchased", hasPurchased);
        return ApiResponse.<Map<String, Boolean>>builder()
                .message("Purchase check result")
                .result(result)
                .build();
    }
}

