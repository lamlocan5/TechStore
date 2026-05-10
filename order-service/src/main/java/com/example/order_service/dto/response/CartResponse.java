package com.example.order_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartResponse {
    Long id;
    String userId;
    List<CartItemResponse> items;
    Integer totalItems;
    Long totalAmount;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

