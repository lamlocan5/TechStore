package com.example.order_service.repository;

import com.example.order_service.entity.UserVoucherEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucherEntity, Long> {

    List<UserVoucherEntity> findByUserId(String userId);

    List<UserVoucherEntity> findByUserIdAndIsUsed(String userId, Boolean isUsed);

    long countByUserIdAndVoucherId(String userId, Long voucherId);

    Optional<UserVoucherEntity> findByUserIdAndVoucherIdAndIsUsed(String userId, Long voucherId, Boolean isUsed);
}
