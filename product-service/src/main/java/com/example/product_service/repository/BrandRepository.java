package com.example.product_service.repository;

import com.example.product_service.entity.BrandEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandRepository extends JpaRepository<BrandEntity, Long> {
    List<BrandEntity> findByNameContainingIgnoreCase(String name);
    Page<BrandEntity> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
