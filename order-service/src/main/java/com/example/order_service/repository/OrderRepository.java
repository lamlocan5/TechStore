package com.example.order_service.repository;

import com.example.order_service.entity.OrderEntity;
import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.OrderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    List<OrderEntity> findByUserId(String userId);
    Page<OrderEntity> findByUserId(String userId, Pageable pageable);
    List<OrderEntity> findByUserIdAndStatus(String userId, OrderStatus status);
    Page<OrderEntity> findByUserIdAndStatus(String userId, OrderStatus status, Pageable pageable);
    List<OrderEntity> findByStatus(OrderStatus status);
    Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);
    Page<OrderEntity> findByOrderType(OrderType orderType, Pageable pageable);
    
    // Count orders by status
    long countByStatus(OrderStatus status);
    
    // Get completed orders by year and month for revenue statistics
    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND YEAR(o.createdAt) = :year " +
           "AND (:month IS NULL OR MONTH(o.createdAt) = :month)")
    List<OrderEntity> findByStatusAndYearAndMonth(
            @Param("status") OrderStatus status,
            @Param("year") int year,
            @Param("month") Integer month
    );
}


