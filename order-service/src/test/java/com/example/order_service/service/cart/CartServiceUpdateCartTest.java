package com.example.order_service.service.cart;

import static org.junit.jupiter.api.Assertions.*;

import com.example.order_service.dto.request.AddToCartRequest;
import com.example.order_service.dto.request.UpdateCartItemRequest;
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
public class CartServiceUpdateCartTest {

    @Autowired
    private CartService cartService;

    private Long addInitialItem(String userId) {
        CartResponse cart = cartService.addToCart(userId, AddToCartRequest.builder()
                .productId(100L).quantity(2).price(50000L).build());
        return cart.getItems().get(0).getId();
    }

    /**
     * TEST CASE ID: ORD_42
     */
    @Test
    @DisplayName("ORD_42: Cập nhật số lượng sản phẩm hợp lệ thành công")
    void ORD_42_updateCartItem_validQuantity_success() {
        // 1. INPUT
        String userId = "user-upd-01";
        Long itemId = addInitialItem(userId);
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(5).build();

        // 2. GỌI HÀM
        CartResponse response = cartService.updateCartItem(userId, itemId, request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(5, response.getItems().get(0).getQuantity());
        assertEquals(250000L, response.getTotalAmount()); // 5 * 50000
    }

    /**
     * TEST CASE ID: ORD_43
     */
    @Test
    @DisplayName("ORD_43: Cập nhật số lượng thất bại do ID sản phẩm (itemId) không tồn tại")
    void ORD_43_updateCartItem_itemNotFound_fail() {
        // 1. INPUT
        String userId = "user-upd-02";
        cartService.getOrCreateCart(userId); // Khởi tạo giỏ hàng rỗng
        Long invalidItemId = 999999L;
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(2).build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            cartService.updateCartItem(userId, invalidItemId, request);
        });
        assertEquals(ErrorCode.CART_ITEM_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_44
     */
    @Test
    @DisplayName("ORD_44: Cập nhật số lượng thất bại do sản phẩm nằm ở giỏ hàng của user khác")
    void ORD_44_updateCartItem_itemNotBelongToUser_fail() {
        // 1. INPUT - Tạo giỏ hàng cho user 1
        String user1 = "user-upd-03A";
        Long itemId = addInitialItem(user1);

        // User 2 cố gắng sửa item của User 1
        String user2 = "user-upd-03B";
        cartService.getOrCreateCart(user2); // Khởi tạo giỏ cho user 2
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(10).build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            cartService.updateCartItem(user2, itemId, request);
        });
        assertEquals(ErrorCode.CART_ITEM_NOT_BELONG_TO_USER, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_45
     */
    @Test
    @DisplayName("ORD_45: Cập nhật thất bại do số lượng bằng 0 hoặc âm")
    void ORD_45_updateCartItem_quantityZeroOrNegative_fail() {
        // 1. INPUT
        String userId = "user-upd-04";
        Long itemId = addInitialItem(userId);
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(0).build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            cartService.updateCartItem(userId, itemId, request);
        });
        assertEquals(ErrorCode.CART_ITEM_QUANTITY_INVALID, exception.getErrorCode());
    }
}
