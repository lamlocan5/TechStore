package com.example.order_service.repository;

import com.example.order_service.entity.VoucherEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<VoucherEntity, Long> {
    Optional<VoucherEntity> findByCode(String code);
    
    @Query("SELECT v FROM VoucherEntity v WHERE v.status = 1 " +
           "AND v.startAt <= :now AND v.endAt >= :now")
    List<VoucherEntity> findActiveVouchers(@Param("now") LocalDateTime now);
    
    @Query("SELECT v FROM VoucherEntity v WHERE v.status = 1 " +
           "AND v.startAt <= :now AND v.endAt >= :now")
    Page<VoucherEntity> findActiveVouchers(@Param("now") LocalDateTime now, Pageable pageable);
}

