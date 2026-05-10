package com.example.chatbot_service.repository;

import com.example.chatbot_service.entity.ResponseCacheEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResponseCacheRepository extends JpaRepository<ResponseCacheEntity, String> {

    Optional<ResponseCacheEntity> findByCacheKey(String cacheKey);

    @Query("SELECT c FROM ResponseCacheEntity c WHERE c.cacheKey = :cacheKey " +
           "AND c.expiresAt > :now")
    Optional<ResponseCacheEntity> findValidCacheByCacheKey(
        @Param("cacheKey") String cacheKey,
        @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("DELETE FROM ResponseCacheEntity c WHERE c.expiresAt < :now")
    int deleteExpiredCache(@Param("now") LocalDateTime now);

    @Modifying
    @Query(value = "DELETE FROM chatbot_response_cache WHERE JSON_CONTAINS(product_ids, CAST(:productId AS JSON), '$')",
           nativeQuery = true)
    int deleteByProductId(@Param("productId") Long productId);

    List<ResponseCacheEntity> findTop10ByOrderByHitCountDesc();
}
