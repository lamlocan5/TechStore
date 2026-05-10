package com.example.order_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderStatusRequest {
    String code;
    String name;
    String description;
    String color;
    Integer displayOrder;
    Boolean isActive;
    Boolean isDefault;
}

