package com.example.order_service.controller;

import com.example.order_service.dto.ApiResponse;
import com.example.order_service.dto.request.AddToCartRequest;
import com.example.order_service.dto.request.UpdateCartItemRequest;
import com.example.order_service.dto.response.CartResponse;
import com.example.order_service.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    private String getAuthenticatedUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ApiResponse<CartResponse> getMyCart() {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<CartResponse>builder()
                .message("Cart retrieved successfully")
                .result(cartService.getMyCart(userId))
                .build();
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addToCart(@RequestBody AddToCartRequest request) {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<CartResponse>builder()
                .message("Item added to cart successfully")
                .result(cartService.addToCart(userId, request))
                .build();
    }

    @PutMapping("/items/{itemId}")
    public ApiResponse<CartResponse> updateCartItem(
            @PathVariable Long itemId,
            @RequestBody UpdateCartItemRequest request) {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<CartResponse>builder()
                .message("Cart item updated successfully")
                .result(cartService.updateCartItem(userId, itemId, request))
                .build();
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartResponse> removeFromCart(@PathVariable Long itemId) {
        String userId = getAuthenticatedUserId();
        return ApiResponse.<CartResponse>builder()
                .message("Item removed from cart successfully")
                .result(cartService.removeFromCart(userId, itemId))
                .build();
    }

    @DeleteMapping("/clear")
    public ApiResponse<Void> clearCart() {
        String userId = getAuthenticatedUserId();
        cartService.clearCart(userId);
        return ApiResponse.<Void>builder()
                .message("Cart cleared successfully")
                .build();
    }
}

