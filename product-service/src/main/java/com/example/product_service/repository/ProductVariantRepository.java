package com.example.product_service.repository;

import com.example.product_service.entity.ProductVariantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, Long> {
    List<ProductVariantEntity> findByProductId(Long productId);
    List<ProductVariantEntity> findBySkuContainingIgnoreCase(String sku);
    Page<ProductVariantEntity> findBySkuContainingIgnoreCase(String sku, Pageable pageable);
    
    // Tìm biến thể còn tồn kho (>0)
    Page<ProductVariantEntity> findByStockGreaterThan(Integer stock, Pageable pageable);
    List<ProductVariantEntity> findByStockGreaterThan(Integer stock);
    
    // Lấy tổng số lượng tồn kho
    @Query("SELECT COALESCE(SUM(v.stock), 0) FROM ProductVariantEntity v")
    Long getTotalStock();
}
