package com.example.order_service.repository;

import com.example.order_service.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
    List<OrderItemEntity> findByOrderId(Long orderId);
    
       /**
        * Tính tổng số lượng item từ các đơn đã thanh toán (paymentStatus = PAID, bỏ qua CANCELLED).
        * @return tổng số lượng item trong các đơn đã thanh toán
        */
    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItemEntity oi " +
           "JOIN oi.order o " +
           "WHERE o.paymentStatus = com.example.order_service.enums.PaymentStatus.PAID " +
           "AND o.status != com.example.order_service.enums.OrderStatus.CANCELLED")
    Long sumQuantityFromCompletedOrders();
    
       /**
        * Lấy số lượng đã bán theo variantId từ các đơn đã thanh toán (PAID, loại trừ PENDING/CANCELLED).
        * @return danh sách [variantId, totalQuantity]
        */
    @Query("SELECT oi.variantId, SUM(oi.quantity) as totalQuantity " +
           "FROM OrderItemEntity oi " +
           "JOIN oi.order o " +
           "WHERE o.paymentStatus = com.example.order_service.enums.PaymentStatus.PAID " +
           "AND o.status != com.example.order_service.enums.OrderStatus.CANCELLED " +
           "AND oi.variantId IS NOT NULL " +
           "GROUP BY oi.variantId")
    List<Object[]> getSoldQuantitiesByVariantId();
    
    /**
     * Kiểm tra xem user đã mua sản phẩm (có order COMPLETED với productId này) chưa
     * @param userId ID của user
     * @param productId ID của sản phẩm
     * @return true nếu user đã mua sản phẩm (có ít nhất 1 order COMPLETED chứa productId này)
     */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItemEntity oi " +
           "JOIN oi.order o " +
           "WHERE o.userId = :userId " +
           "AND oi.productId = :productId " +
           "AND o.status = com.example.order_service.enums.OrderStatus.COMPLETED")
    boolean hasUserPurchasedProduct(@Param("userId") String userId, @Param("productId") Long productId);
}

