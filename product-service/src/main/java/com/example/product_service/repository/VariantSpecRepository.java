package com.example.product_service.repository;

import com.example.product_service.entity.VariantSpecEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VariantSpecRepository extends JpaRepository<VariantSpecEntity, String> {
    List<VariantSpecEntity> findByProductVariantId(Long productVariantId);
}
