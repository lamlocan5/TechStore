package com.example.order_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SalesStatisticsResponse {
    Long totalSold;      // Tổng số lượng sản phẩm đã bán (tổng quantity từ order items của các order COMPLETED)
    Long totalOrders;    // Tổng số đơn hàng COMPLETED
}

