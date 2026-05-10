package com.example.order_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemRequest {
    Long productId;
    Long variantId;
    String productName;
    String sku;
    String attributesName;
    Integer quantity;
    Long price;
}

