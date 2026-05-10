package com.example.order_service.repository;

import com.example.order_service.entity.CartItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    List<CartItemEntity> findByCartId(Long cartId);
    Optional<CartItemEntity> findByCartIdAndProductIdAndVariantId(Long cartId, Long productId, Long variantId);
    void deleteByCartId(Long cartId);
}

