package com.example.order_service.service.cart;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.order_service.dto.response.CartResponse;
import com.example.order_service.entity.CartEntity;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.service.CartService;

@SpringBootTest
@Transactional
public class CartServiceGetCartTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    /**
     * TEST CASE ID: ORD_36
     */
    @Test
    @DisplayName("ORD_36: Lấy giỏ hàng thành công khi user đã có giỏ hàng")
    void ORD_36_getOrCreateCart_existingCart_success() {
        // 1. INPUT - Tạo sẵn giỏ hàng cho user
        CartEntity cart = CartEntity.builder().userId("user-cart-01").build();
        cartRepository.saveAndFlush(cart);

        // 2. GỌI HÀM
        CartResponse response = cartService.getOrCreateCart("user-cart-01");

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(cart.getId(), response.getId());
        assertEquals("user-cart-01", response.getUserId());
    }

    /**
     * TEST CASE ID: ORD_37
     */
    @Test
    @DisplayName("ORD_37: Tự động tạo giỏ hàng mới khi user chưa có giỏ hàng")
    void ORD_37_getOrCreateCart_newCart_success() {
        // 1. INPUT - User chưa có giỏ hàng
        String userId = "user-cart-02-new";

        // 2. GỌI HÀM
        CartResponse response = cartService.getOrCreateCart(userId);

        // 3. EXPECTED OUTPUT - Tạo mới thành công
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(userId, response.getUserId());
        assertTrue(response.getItems().isEmpty());

        // Kiểm tra trong DB
        assertTrue(cartRepository.findByUserId(userId).isPresent());
    }

    /**
     * TEST CASE ID: ORD_38
     */
    @Test
    @DisplayName("ORD_38: Gọi hàm getOrCreateCart khi user không tồn tại trong hệ thống")
    void ORD_38_getOrCreateCart_userNotExists_throwException() {
        // 1. INPUT - ID user không tồn tại (ảo)
        String invalidUserId = "invalid-user-999999";

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT - Ném Exception do userId không tồn tại
        assertThrows(Exception.class, () -> {
            cartService.getOrCreateCart(invalidUserId);
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo giỏ hàng cho user không tồn tại mà không kiểm tra (IdentityService)!");
    }
}
