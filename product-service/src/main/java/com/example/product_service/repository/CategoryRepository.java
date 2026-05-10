package com.example.product_service.repository;

import com.example.product_service.entity.CategoryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
    List<CategoryEntity> findByNameContainingIgnoreCase(String name);
    Page<CategoryEntity> findByNameContainingIgnoreCase(String name, Pageable pageable);
}