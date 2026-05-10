package com.example.order_service.service.cart;

import static org.junit.jupiter.api.Assertions.*;

import com.example.order_service.dto.request.AddToCartRequest;
import com.example.order_service.dto.response.CartResponse;
import com.example.order_service.entity.CartEntity;
import com.example.order_service.repository.CartRepository;
import com.example.order_service.service.CartService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class CartServiceAddToCartTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    /**
     * TEST CASE ID: ORD_39
     */
    @Test
    @DisplayName("ORD_39: Thêm sản phẩm mới vào giỏ hàng thành công")
    void ORD_39_addToCart_newItem_success() {
        // 1. INPUT
        String userId = "user-add-01";
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(100L)
                .variantId(200L)
                .quantity(2)
                .price(150000L)
                .attributesName("Đen, XL")
                .build();

        // 2. GỌI HÀM
        CartResponse response = cartService.addToCart(userId, request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(100L, response.getItems().get(0).getProductId());
        assertEquals(2, response.getItems().get(0).getQuantity());
        assertEquals(300000L, response.getTotalAmount()); // 2 * 150000
    }

    /**
     * TEST CASE ID: ORD_40
     */
    @Test
    @DisplayName("ORD_40: Thêm sản phẩm đã có trong giỏ hàng (cộng dồn số lượng và cập nhật giá mới)")
    void ORD_40_addToCart_existingItem_updatesQuantityAndPrice() {
        // 1. INPUT - Thêm sản phẩm lần 1
        String userId = "user-add-02";
        cartService.addToCart(userId, AddToCartRequest.builder()
                .productId(100L).variantId(200L).quantity(1).price(100000L).build());

        // Thêm tiếp cùng sản phẩm đó (lần 2) với giá mới
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(100L)
                .variantId(200L)
                .quantity(3)
                .price(120000L) // Giá mới
                .build();

        // 2. GỌI HÀM
        CartResponse response = cartService.addToCart(userId, request);

        // 3. EXPECTED OUTPUT - Cộng dồn số lượng (1 + 3 = 4), cập nhật giá mới (120000)
        assertNotNull(response);
        assertEquals(1, response.getItems().size(), "Không được tạo thêm dòng mới, phải dùng dòng cũ!");
        assertEquals(4, response.getItems().get(0).getQuantity());
        assertEquals(120000L, response.getItems().get(0).getPriceSnapshot());
        assertEquals(480000L, response.getTotalAmount()); // 4 * 120000
    }

    /**
     * TEST CASE ID: ORD_41
     */
    @Test
    @DisplayName("ORD_41: Thêm sản phẩm thất bại do sản phẩm không tồn tại (Test tìm Bug)")
    void ORD_41_addToCart_productNotFound_fail() {
        // 1. INPUT - Sản phẩm ID không tồn tại
        String userId = "user-add-03";
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(999999L) // Không có trong hệ thống
                .quantity(1)
                .price(100000L)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            cartService.addToCart(userId, request);
        }, "LỖI HỆ THỐNG: Hệ thống cho phép thêm sản phẩm không tồn tại vào giỏ hàng mà không kiểm tra (ProductServiceClient)!");
    }
}
