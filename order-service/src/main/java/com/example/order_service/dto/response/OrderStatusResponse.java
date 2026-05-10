package com.example.order_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderStatusResponse {
    Long id;
    String code;
    String name;
    String description;
    String color;
    Integer displayOrder;
    Boolean isActive;
    Boolean isDefault;
}

