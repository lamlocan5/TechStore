package com.example.product_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    Long id;
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
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<ProductVariantResponse> variants;
    
    // Trường bổ sung tối ưu cho danh sách
    String brandName;
    List<String> categoryNames;
    Long minPrice;
    Long maxPrice;
    Integer totalStock;
    Integer variantCount;
}
