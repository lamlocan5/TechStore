package com.example.product_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductRequest {
    List<Long> categoryIds;
    Long brandId;
    String name;
    String slug;
    String shortDescription;
    String description;
    Long priceList;
    Long priceSale;
    String avatar;
    String images;
    Boolean status;
    String firstImage;
}
