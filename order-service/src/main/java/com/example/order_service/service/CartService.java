package com.example.order_service.service;

import com.example.order_service.dto.request.AddToCartRequest;
import com.example.order_service.dto.request.UpdateCartItemRequest;
import com.example.order_service.dto.response.CartItemResponse;
import com.example.order_service.dto.response.CartResponse;
import com.example.order_service.entity.CartEntity;
import com.example.order_service.entity.CartItemEntity;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.CartItemRepository;
import com.example.order_service.repository.CartRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    private CartItemResponse mapItemToResponse(CartItemEntity item) {
        return CartItemResponse.builder()
                .id(item.getId())
                .cartId(item.getCart().getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .quantity(item.getQuantity())
                .priceSnapshot(item.getPriceSnapshot())
                .attributesName(item.getAttributesName())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private CartResponse mapToResponse(CartEntity cart) {
        List<CartItemResponse> items = cart.getItems() != null
                ? cart.getItems().stream()
                        .map(this::mapItemToResponse)
                        .collect(Collectors.toList())
                : new ArrayList<>();

        int totalItems = items.size();

        long totalAmount = items.stream()
                .mapToLong(item -> item.getPriceSnapshot() * item.getQuantity())
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(items)
                .totalItems(totalItems)
                .totalAmount(totalAmount)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    public CartResponse getOrCreateCart(String userId) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    CartEntity newCart = CartEntity.builder()
                            .userId(userId)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        return mapToResponse(cart);
    }

    public CartResponse addToCart(String userId, AddToCartRequest request) {
        // Get or create cart
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    CartEntity newCart = CartEntity.builder()
                            .userId(userId)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        // Check if item already exists in cart
        Long variantId = request.getVariantId() != null ? request.getVariantId() : 0L;
        CartItemEntity existingItem = cartItemRepository
                .findByCartIdAndProductIdAndVariantId(cart.getId(), request.getProductId(), variantId)
                .orElse(null);

        if (existingItem != null) {
            // Update quantity if item exists
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            existingItem.setPriceSnapshot(request.getPrice()); // Update price
            cartItemRepository.save(existingItem);
        } else {
            // Add new item
            CartItemEntity newItem = CartItemEntity.builder()
                    .cart(cart)
                    .productId(request.getProductId())
                    .variantId(request.getVariantId())
                    .quantity(request.getQuantity())
                    .priceSnapshot(request.getPrice())
                    .attributesName(request.getAttributesName())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToResponse(cartRepository.save(cart));
    }

    public CartResponse updateCartItem(String userId, Long itemId, UpdateCartItemRequest request) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        CartItemEntity item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        // Verify item belongs to user's cart
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_BELONG_TO_USER);
        }

        if (request.getQuantity() <= 0) {
            throw new AppException(ErrorCode.CART_ITEM_QUANTITY_INVALID);
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return mapToResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    public CartResponse removeFromCart(String userId, Long itemId) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        CartItemEntity item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        // Verify item belongs to user's cart
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_BELONG_TO_USER);
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return mapToResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    public void clearCart(String userId) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    public CartResponse getMyCart(String userId) {
        return getOrCreateCart(userId);
    }
}

