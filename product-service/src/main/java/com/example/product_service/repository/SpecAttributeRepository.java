package com.example.product_service.repository;

import com.example.product_service.entity.SpecAttributeEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecAttributeRepository extends JpaRepository<SpecAttributeEntity, Long> {
    List<SpecAttributeEntity> findByLabelContainingIgnoreCase(String label);
    Page<SpecAttributeEntity> findByLabelContainingIgnoreCase(String label, Pageable pageable);
}
