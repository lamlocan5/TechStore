package com.example.product_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductSearchRequest {
    
    String keyword; // Từ khóa tìm kiếm (tên sản phẩm) - hỗ trợ fuzzy search
    
    Long minPrice; // Giá tối thiểu (lọc theo priceSale)
    
    Long maxPrice; // Giá tối đa (lọc theo priceSale)
    
    Long brandId; // ID thương hiệu
    
    Integer page; // Số trang (mặc định: 1)
    
    Integer limit; // Số lượng mỗi trang (mặc định: 12)
}

