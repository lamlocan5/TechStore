package com.example.product_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantRequest {
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
    Boolean allowPreorder;
}
