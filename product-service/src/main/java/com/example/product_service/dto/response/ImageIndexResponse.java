package com.example.product_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ImageIndexResponse {
    Long productId;
    Integer imagesIndexed;
    Integer imagesFailed;
}
