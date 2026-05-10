package com.example.order_service.service.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.client.ProductServiceClient;
import com.example.order_service.dto.request.OrderItemRequest;
import com.example.order_service.dto.request.OrderRequest;
import com.example.order_service.dto.response.OrderResponse;
import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.PaymentMethod;
import com.example.order_service.enums.PaymentStatus;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
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
public class OrderServiceCreateOrderTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private ProductServiceClient productServiceClient;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private OrderItemRequest buildItem(Long variantId, int qty, long price) {
        return OrderItemRequest.builder()
                .productId(1L)
                .variantId(variantId)
                .productName("Test Product")
                .sku("SKU-001")
                .quantity(qty)
                .price(price)
                .build();
    }

    private OrderRequest buildRequest(List<OrderItemRequest> items, long shippingFee) {
        return OrderRequest.builder()
                .addressId(1L)
                .paymentMethod(PaymentMethod.COD)
                .shippingFee(shippingFee)
                .preorder(false)
                .items(items)
                .build();
    }

    /**
     * TEST CASE ID: ORD_50
     */
    @Test
    @DisplayName("ORD_50: Tạo đơn hàng NORMAL thành công khi tồn kho đủ")
    void ORD_50_createOrder_normalOrder_success() {
        // 1. INPUT
        when(productServiceClient.checkStockAvailability(anyLong(), anyInt())).thenReturn(true);
        doNothing().when(productServiceClient).reserveStock(anyLong(), anyInt());

        OrderRequest request = buildRequest(List.of(buildItem(100L, 2, 150000L)), 30000L);

        // 2. GỌI HÀM
        OrderResponse response = orderService.createOrder("user-ord-01", request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus());
        assertEquals(1, response.getItems().size());
        assertTrue(orderRepository.existsById(response.getId()));
    }

    /**
     * TEST CASE ID: ORD_51
     */
    @Test
    @DisplayName("ORD_51: Tạo đơn thất bại do hết hàng (tồn kho = 0)")
    void ORD_51_createOrder_outOfStock_fail() {
        // 1. INPUT - Tồn kho = 0, hết hàng hoàn toàn
        when(productServiceClient.checkStockAvailability(anyLong(), anyInt())).thenReturn(false);

        OrderRequest request = buildRequest(List.of(buildItem(100L, 1, 150000L)), 0L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.createOrder("user-ord-02", request);
        });
        assertEquals(ErrorCode.INSUFFICIENT_STOCK, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_52
     */
    @Test
    @DisplayName("ORD_52: Tạo đơn thất bại do số lượng đặt vượt quá tồn kho (có hàng nhưng không đủ)")
    void ORD_52_createOrder_quantityExceedsStock_fail() {
        // 1. INPUT - Tồn kho có 5, đặt 10 → không đủ → service trả false
        when(productServiceClient.checkStockAvailability(eq(100L), eq(10))).thenReturn(false);

        OrderRequest request = buildRequest(List.of(buildItem(100L, 10, 150000L)), 0L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.createOrder("user-ord-03", request);
        });
        assertEquals(ErrorCode.INSUFFICIENT_STOCK, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_53
     */
    @Test
    @DisplayName("ORD_53: Tạo đơn thất bại do variantId null (thiếu thông tin biến thể)")
    void ORD_53_createOrder_nullVariantId_fail() {
        // 1. INPUT - Item không có variantId
        OrderItemRequest item = buildItem(null, 1, 100000L); // variantId = null
        OrderRequest request = buildRequest(List.of(item), 0L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            orderService.createOrder("user-ord-04", request);
        });
        assertEquals(ErrorCode.PRODUCT_VARIANT_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_54
     */
    @Test
    @DisplayName("ORD_54: Kiểm tra tính toán total = subtotal - discount + shippingFee")
    void ORD_54_createOrder_calculatesTotal_correct() {
        // 1. INPUT - 2 sản phẩm, giá khác nhau
        when(productServiceClient.checkStockAvailability(anyLong(), anyInt())).thenReturn(true);
        doNothing().when(productServiceClient).reserveStock(anyLong(), anyInt());

        OrderItemRequest item1 = buildItem(101L, 2, 100000L); // subtotal: 200000
        OrderItemRequest item2 = buildItem(102L, 1, 50000L);  // subtotal: 50000
        // Total subtotal = 250000, shippingFee = 30000, no voucher
        OrderRequest request = buildRequest(List.of(item1, item2), 30000L);

        // 2. GỌI HÀM
        OrderResponse response = orderService.createOrder("user-ord-05", request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(250000L, response.getSubtotal());
        assertEquals(0L, response.getDiscount());
        assertEquals(30000L, response.getShippingFee());
        assertEquals(280000L, response.getTotal()); // 250000 - 0 + 30000
    }

    /**
     * TEST CASE ID: ORD_55
     */
    @Test
    @DisplayName("ORD_55: Đơn hàng mới tạo phải có status=PENDING và paymentStatus=UNPAID")
    void ORD_55_createOrder_defaultStatus_isPending() {
        // 1. INPUT
        when(productServiceClient.checkStockAvailability(anyLong(), anyInt())).thenReturn(true);
        doNothing().when(productServiceClient).reserveStock(anyLong(), anyInt());

        OrderRequest request = buildRequest(List.of(buildItem(100L, 1, 100000L)), 0L);

        // 2. GỌI HÀM
        OrderResponse response = orderService.createOrder("user-ord-06", request);

        // 3. EXPECTED OUTPUT
        assertEquals(OrderStatus.PENDING, response.getStatus(),
                "Đơn hàng mới phải ở trạng thái PENDING!");
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus(),
                "Trạng thái thanh toán mới phải là UNPAID!");
        assertNotNull(response.getItems().get(0).getCreatedAt());
    }

    /**
     * TEST CASE ID: ORD_56
     */
    @Test
    @DisplayName("ORD_56: Tạo đơn thất bại khi không có sản phẩm nào (items rỗng) - Bug Finding")
    void ORD_56_createOrder_noItems_fail() {
        // 1. INPUT - Items rỗng
        OrderRequest request = buildRequest(List.of(), 0L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            orderService.createOrder("user-ord-07", request);
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo đơn hàng không có sản phẩm nào!");
    }
}
