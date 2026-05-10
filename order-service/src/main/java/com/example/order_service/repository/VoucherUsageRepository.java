package com.example.order_service.repository;

import com.example.order_service.entity.VoucherUsageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoucherUsageRepository extends JpaRepository<VoucherUsageEntity, Long> {
    List<VoucherUsageEntity> findByVoucherId(Long voucherId);
    List<VoucherUsageEntity> findByUserId(String userId);
    List<VoucherUsageEntity> findByVoucherIdAndUserId(Long voucherId, String userId);
    long countByVoucherId(Long voucherId);
    long countByVoucherIdAndUserId(Long voucherId, String userId);
}

