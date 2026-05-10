package com.example.order_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    Long id;
    Long cartId;
    Long productId;
    Long variantId;
    Integer quantity;
    Long priceSnapshot;
    String attributesName;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

