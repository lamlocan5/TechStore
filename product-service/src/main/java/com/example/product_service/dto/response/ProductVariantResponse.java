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
public class ProductVariantResponse {
    Long id;
    Long productId;
    String sku;
    String color;
    Integer ramGb;
    Integer storageGb;
    String cpuModel;
    String igpu;
    String gpuModel;
    String chipsetModel;
    String os;
    Long priceList;
    Long priceSale;
    Integer stock;
    Integer weightG;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    Boolean allowPreorder;
    List<VariantSpecResponse> specs;
    
    // Nested product info to avoid additional API calls
    ProductBasicInfo product;
}
