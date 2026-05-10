package com.example.order_service.service.cart;

import static org.junit.jupiter.api.Assertions.*;

import com.example.order_service.dto.request.AddToCartRequest;
import com.example.order_service.dto.response.CartResponse;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.service.CartService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class CartServiceDeleteCartTest {

    @Autowired
    private CartService cartService;

    private Long addInitialItem(String userId) {
        CartResponse cart = cartService.addToCart(userId, AddToCartRequest.builder()
                .productId(100L).quantity(2).price(50000L).build());
        return cart.getItems().get(0).getId();
    }

    /**
     * TEST CASE ID: ORD_46
     */
    @Test
    @DisplayName("ORD_46: Xoá 1 sản phẩm khỏi giỏ hàng thành công")
    void ORD_46_removeFromCart_validItem_success() {
        // 1. INPUT
        String userId = "user-del-01";
        Long itemId = addInitialItem(userId);

        // Đảm bảo trước khi xóa có 1 item
        assertEquals(1, cartService.getMyCart(userId).getItems().size());

        // 2. GỌI HÀM
        CartResponse response = cartService.removeFromCart(userId, itemId);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
        assertEquals(0L, response.getTotalAmount());
    }

    /**
     * TEST CASE ID: ORD_47
     */
    @Test
    @DisplayName("ORD_47: Xoá sản phẩm thất bại do ID sản phẩm không tồn tại")
    void ORD_47_removeFromCart_itemNotFound_fail() {
        // 1. INPUT
        String userId = "user-del-02";
        cartService.getOrCreateCart(userId);
        Long invalidItemId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            cartService.removeFromCart(userId, invalidItemId);
        });
        assertEquals(ErrorCode.CART_ITEM_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_48
     */
    @Test
    @DisplayName("ORD_48: Xoá toàn bộ sản phẩm trong giỏ (clear cart) thành công")
    void ORD_48_clearCart_validCart_success() {
        // 1. INPUT - Thêm 2 sản phẩm khác nhau
        String userId = "user-del-03";
        cartService.addToCart(userId, AddToCartRequest.builder().productId(1L).quantity(1).price(10L).build());
        cartService.addToCart(userId, AddToCartRequest.builder().productId(2L).quantity(1).price(20L).build());

        assertEquals(2, cartService.getMyCart(userId).getItems().size());

        // 2. GỌI HÀM
        cartService.clearCart(userId);

        // 3. EXPECTED OUTPUT
        CartResponse response = cartService.getMyCart(userId);
        assertTrue(response.getItems().isEmpty());
        assertEquals(0L, response.getTotalAmount());
    }

    /**
     * TEST CASE ID: ORD_49
     */
    @Test
    @DisplayName("ORD_49: Xoá toàn bộ giỏ hàng thất bại do giỏ hàng không tồn tại")
    void ORD_49_clearCart_cartNotFound_fail() {
        // 1. INPUT - User chưa bao giờ được khởi tạo giỏ hàng
        String invalidUserId = "user-del-04-no-cart";

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            cartService.clearCart(invalidUserId);
        });
        assertEquals(ErrorCode.CART_NOT_FOUND, exception.getErrorCode());
    }
}
