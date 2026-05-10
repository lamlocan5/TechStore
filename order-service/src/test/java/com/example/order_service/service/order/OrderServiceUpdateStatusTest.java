package com.example.order_service.service.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;

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
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class OrderServiceUpdateStatusTest {

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
     * TEST CASE ID: ORD_63
     */
    @Test
    @DisplayName("ORD_63: Chuyển trạng thái PENDING → PAID thành công, ghi nhận paidAt")
    void ORD_63_updateStatus_pendingToPaid_success() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-01", OrderStatus.PENDING);

        // 2. GỌI HÀM
        OrderResponse response = orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(OrderStatus.PAID, response.getStatus());
        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
        assertNotNull(response.getPaidAt(), "paidAt phải được ghi nhận khi chuyển sang PAID!");
    }

    /**
     * TEST CASE ID: ORD_64
     */
    @Test
    @DisplayName("ORD_64: Chuyển trạng thái PAID → SHIPPING thành công, ghi nhận shippedAt")
    void ORD_64_updateStatus_paidToShipping_success() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-02", OrderStatus.PAID);

        // 2. GỌI HÀM
        OrderResponse response = orderService.updateOrderStatus(order.getId(), OrderStatus.SHIPPING);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(OrderStatus.SHIPPING, response.getStatus());
        assertNotNull(response.getShippedAt(), "shippedAt phải được ghi nhận khi chuyển sang SHIPPING!");
    }

    /**
     * TEST CASE ID: ORD_65
     */
    @Test
    @DisplayName("ORD_65: Chuyển trạng thái SHIPPING → COMPLETED thành công, ghi nhận completedAt")
    void ORD_65_updateStatus_shippingToCompleted_success() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-03", OrderStatus.SHIPPING);
        // identityServiceClient.addTotalSpent() được gọi trong try-catch → không fail test
        doNothing().when(identityServiceClient).addTotalSpent(anyString(), anyLong());

        // 2. GỌI HÀM
        OrderResponse response = orderService.updateOrderStatus(order.getId(), OrderStatus.COMPLETED);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(OrderStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getCompletedAt(), "completedAt phải được ghi nhận khi chuyển sang COMPLETED!");
    }

    /**
     * TEST CASE ID: ORD_66
     */
    @Test
    @DisplayName("ORD_66: Hủy đơn hàng từ trạng thái PENDING thành công, ghi nhận cancelledAt")
    void ORD_66_updateStatus_cancelOrder_success() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-04", OrderStatus.PENDING);
        doNothing().when(productServiceClient).releaseStock(anyLong(), anyInt());

        // 2. GỌI HÀM
        OrderResponse response = orderService.updateOrderStatus(order.getId(), OrderStatus.CANCELLED);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertNotNull(response.getCancelledAt(), "cancelledAt phải được ghi nhận khi hủy đơn!");
    }

    /**
     * TEST CASE ID: ORD_67
     */
    @Test
    @DisplayName("ORD_67: Chuyển trạng thái sai lộ trình (PENDING → COMPLETED) thất bại")
    void ORD_67_updateStatus_invalidTransition_fail() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-05", OrderStatus.PENDING);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT — Bỏ qua bước PAID, SHIPPING
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.updateOrderStatus(order.getId(), OrderStatus.COMPLETED);
        });
        assertEquals(ErrorCode.ORDER_INVALID_STATUS_TRANSITION, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_68
     */
    @Test
    @DisplayName("ORD_68: Hủy đơn đã COMPLETED thất bại")
    void ORD_68_updateStatus_cancelCompleted_fail() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-06", OrderStatus.COMPLETED);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.updateOrderStatus(order.getId(), OrderStatus.CANCELLED);
        });
        assertEquals(ErrorCode.ORDER_CANNOT_CANCEL_COMPLETED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_69
     */
    @Test
    @DisplayName("ORD_69: Hủy đơn đã CANCELLED thất bại")
    void ORD_69_updateStatus_cancelAlreadyCancelled_fail() {
        // 1. INPUT
        OrderEntity order = createAndSaveOrder("user-upd-07", OrderStatus.CANCELLED);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.updateOrderStatus(order.getId(), OrderStatus.CANCELLED);
        });
        assertEquals(ErrorCode.ORDER_ALREADY_CANCELLED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_70
     */
    @Test
    @DisplayName("ORD_70: Đổi trạng thái thất bại do ID đơn hàng không tồn tại")
    void ORD_70_updateStatus_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.updateOrderStatus(invalidId, OrderStatus.PAID);
        });
        assertEquals(ErrorCode.ORDER_NOT_FOUND, exception.getErrorCode());
    }
}
