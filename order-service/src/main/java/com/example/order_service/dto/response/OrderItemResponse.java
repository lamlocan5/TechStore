package com.example.order_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    Long id;
    Long orderId;
    Long productId;
    Long variantId;
    String productName;
    String sku;
    String attributesName;
    Integer quantity;
    Long price;
    Long total;
    LocalDateTime createdAt;
}

