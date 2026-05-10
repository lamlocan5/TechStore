package com.example.order_service.service.order;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.client.ProductServiceClient;
import com.example.order_service.dto.response.OrderResponse;
import com.example.order_service.entity.OrderEntity;
import com.example.order_service.entity.OrderItemEntity;
import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.OrderType;
import com.example.order_service.enums.PaymentMethod;
import com.example.order_service.enums.PaymentStatus;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.OrderItemRepository;
import com.example.order_service.repository.OrderRepository;
import com.example.order_service.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class OrderServiceGetOrderTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @MockBean
    private ProductServiceClient productServiceClient;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private OrderEntity createAndSaveOrder(String userId, OrderStatus status) {
        OrderEntity order = OrderEntity.builder()
                .userId(userId)
                .status(status)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.UNPAID)
                .orderType(OrderType.NORMAL)
                .subtotal(200000L)
                .discount(0L)
                .shippingFee(30000L)
                .total(230000L)
                .items(new ArrayList<>())
                .build();
        order = orderRepository.saveAndFlush(order);

        OrderItemEntity item = OrderItemEntity.builder()
                .productId(1L).variantId(100L)
                .productName("Test Product").quantity(2).price(100000L).total(200000L)
                .build();
        item.setOrder(order);
        orderItemRepository.saveAndFlush(item);
        order.getItems().add(item);

        return order;
    }

    /**
     * TEST CASE ID: ORD_57
     */
    @Test
    @DisplayName("ORD_57: Lấy đơn hàng thành công theo ID hợp lệ")
    void ORD_57_getOrderById_validId_success() {
        // 1. INPUT
        OrderEntity saved = createAndSaveOrder("user-get-01", OrderStatus.PENDING);

        // 2. GỌI HÀM
        OrderResponse response = orderService.getOrderById(saved.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        assertEquals("user-get-01", response.getUserId());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertFalse(response.getItems().isEmpty());
    }

    /**
     * TEST CASE ID: ORD_58
     */
    @Test
    @DisplayName("ORD_58: Lấy đơn hàng thất bại do ID không tồn tại")
    void ORD_58_getOrderById_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.getOrderById(invalidId);
        });
        assertEquals(ErrorCode.ORDER_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_59
     */
    @Test
    @DisplayName("ORD_59: Lấy toàn bộ danh sách đơn hàng thành công")
    void ORD_59_getAllOrders_success() {
        // 1. INPUT - Tạo 3 đơn hàng khác userId
        createAndSaveOrder("user-get-02A", OrderStatus.PENDING);
        createAndSaveOrder("user-get-02B", OrderStatus.PAID);
        createAndSaveOrder("user-get-02C", OrderStatus.SHIPPING);

        // 2. GỌI HÀM
        List<OrderResponse> results = orderService.getAllOrders();

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.size() >= 3);
    }

    /**
     * TEST CASE ID: ORD_60
     */
    @Test
    @DisplayName("ORD_60: Lấy danh sách đơn hàng phân trang thành công")
    void ORD_60_getAllOrders_pageable_success() {
        // 1. INPUT - Tạo 5 đơn hàng
        for (int i = 1; i <= 5; i++) {
            createAndSaveOrder("user-get-03-" + i, OrderStatus.PENDING);
        }
        PageRequest pageRequest = PageRequest.of(0, 2);

        // 2. GỌI HÀM
        Page<OrderResponse> results = orderService.getAllOrders(pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(2, results.getSize());
        assertTrue(results.getTotalElements() >= 5);
    }

    /**
     * TEST CASE ID: ORD_61
     */
    @Test
    @DisplayName("ORD_61: Lấy danh sách đơn hàng theo userId thành công")
    void ORD_61_getOrdersByUserId_success() {
        // 1. INPUT - Tạo 2 đơn cho user A, 1 đơn cho user B
        createAndSaveOrder("user-get-04A", OrderStatus.PENDING);
        createAndSaveOrder("user-get-04A", OrderStatus.PAID);
        createAndSaveOrder("user-get-04B", OrderStatus.PENDING);

        // 2. GỌI HÀM
        List<OrderResponse> results = orderService.getOrdersByUserId("user-get-04A");

        // 3. EXPECTED OUTPUT - Chỉ trả về đơn của user A
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(o -> "user-get-04A".equals(o.getUserId())));
    }

    /**
     * TEST CASE ID: ORD_62
     */
    @Test
    @DisplayName("ORD_62: Lấy danh sách đơn hàng theo trạng thái PENDING thành công")
    void ORD_62_getOrdersByStatus_success() {
        // 1. INPUT - Tạo 2 PENDING, 1 PAID
        createAndSaveOrder("user-get-05A", OrderStatus.PENDING);
        createAndSaveOrder("user-get-05B", OrderStatus.PENDING);
        createAndSaveOrder("user-get-05C", OrderStatus.PAID);

        // 2. GỌI HÀM
        List<OrderResponse> results = orderService.getOrdersByStatus(OrderStatus.PENDING);

        // 3. EXPECTED OUTPUT - Chỉ chứa đơn PENDING
        assertNotNull(results);
        assertTrue(results.size() >= 2);
        assertTrue(results.stream().allMatch(o -> OrderStatus.PENDING == o.getStatus()));
        assertFalse(results.stream().anyMatch(o -> OrderStatus.PAID == o.getStatus()));
    }
}
