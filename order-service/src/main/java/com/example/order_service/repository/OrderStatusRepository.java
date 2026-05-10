package com.example.order_service.repository;

import com.example.order_service.entity.OrderStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderStatusRepository extends JpaRepository<OrderStatusEntity, Long> {
    Optional<OrderStatusEntity> findByCode(String code);
    
    List<OrderStatusEntity> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    List<OrderStatusEntity> findAllByOrderByDisplayOrderAsc();
    
    boolean existsByCode(String code);
}

