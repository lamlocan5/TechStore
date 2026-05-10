package com.example.product_service.repository;

import com.example.product_service.entity.ReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    
    Page<ReviewEntity> findByProductId(Long productId, Pageable pageable);
    
    List<ReviewEntity> findByProductId(Long productId);
    
    Optional<ReviewEntity> findByProductIdAndUserId(Long productId, String userId);
    
    @Query("SELECT AVG(r.rating) FROM ReviewEntity r WHERE r.productId = :productId AND r.rating IS NOT NULL")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM ReviewEntity r WHERE r.productId = :productId AND r.rating IS NOT NULL")
    Long countRatingsByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM ReviewEntity r WHERE r.productId = :productId")
    Long countAllReviewsByProductId(@Param("productId") Long productId);
}

