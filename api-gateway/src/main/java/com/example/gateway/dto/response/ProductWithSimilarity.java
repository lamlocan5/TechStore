package com.example.gateway.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductWithSimilarity {
    Map<String, Object> product;  // Full product data from product-service
    Double similarity;
}
