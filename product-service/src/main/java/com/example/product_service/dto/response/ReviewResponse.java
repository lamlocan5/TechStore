package com.example.product_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {
    Long id;
    Long productId;
    String userId;
    Integer rating; // null nếu user chưa mua
    String comment;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

