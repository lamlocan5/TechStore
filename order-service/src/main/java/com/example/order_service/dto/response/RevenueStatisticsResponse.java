package com.example.order_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueStatisticsResponse {
    private Long totalRevenue;           // Tổng doanh thu
    private Integer totalOrders;          // Tổng số đơn
    private Integer totalItems;           // Tổng số sản phẩm bán
    private List<PeriodRevenueDetail> details;  // Chi tiết theo kỳ
    private List<TopProductInfo> topProducts;   // Sản phẩm bán chạy nhất

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PeriodRevenueDetail {
        private String period;            // "1" (tháng 1), "Q1" (quý 1), "2024" (năm)
        private Long revenue;             // Doanh thu
        private Integer orderCount;       // Số đơn
        private Integer itemCount;        // Số sản phẩm bán
        private Long averageOrderValue;   // Giá trị trung bình/đơn
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductInfo {
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;        // Số lượng bán
        private Long revenue;            // Doanh thu
    }
}
