package com.example.chatbot_service.service;

import com.example.chatbot_service.entity.ResponseCacheEntity;
import com.example.chatbot_service.repository.ResponseCacheRepository;
import com.example.chatbot_service.util.QueryNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final ResponseCacheRepository responseCacheRepository;
    private final QueryNormalizer queryNormalizer;

    // TTL for different types of queries
    private static final int PRODUCT_QUERY_TTL_HOURS = 24;
    private static final int STATIC_QUERY_TTL_DAYS = 7;

    /**
     * Get cached response for a query
     *
     * @param query The user query
     * @return Optional cached response
     */
    public Optional<ResponseCacheEntity> getCachedResponse(String query) {
        String normalizedQuery = queryNormalizer.normalize(query);
        String cacheKey = queryNormalizer.generateCacheKey(normalizedQuery);

        Optional<ResponseCacheEntity> cachedResponse = responseCacheRepository
                .findValidCacheByCacheKey(cacheKey, LocalDateTime.now());

        if (cachedResponse.isPresent()) {
            // Increment hit count
            ResponseCacheEntity entity = cachedResponse.get();
            entity.incrementHitCount();
            responseCacheRepository.save(entity);

            log.info("Cache HIT for key: {}, hit count: {}", cacheKey, entity.getHitCount());
            return cachedResponse;
        }

        log.info("Cache MISS for key: {}", cacheKey);
        return Optional.empty();
    }

    /**
     * Save response to cache
     *
     * @param query       Original query
     * @param response    Response text
     * @param productIds  Product IDs mentioned in response
     * @param isStatic    Whether this is a static query (FAQ, policy, etc.)
     */
    @Transactional
    public void cacheResponse(String query, String response, List<Long> productIds, boolean isStatic) {
        String normalizedQuery = queryNormalizer.normalize(query);
        String cacheKey = queryNormalizer.generateCacheKey(normalizedQuery);

        LocalDateTime expiresAt = isStatic
                ? LocalDateTime.now().plusDays(STATIC_QUERY_TTL_DAYS)
                : LocalDateTime.now().plusHours(PRODUCT_QUERY_TTL_HOURS);

        ResponseCacheEntity cacheEntity = ResponseCacheEntity.builder()
                .cacheKey(cacheKey)
                .queryNormalized(normalizedQuery)
                .responseText(response)
                .productIds(productIds)
                .expiresAt(expiresAt)
                .hitCount(0)
                .build();

        responseCacheRepository.save(cacheEntity);
        log.info("Cached response for key: {}, expires at: {}", cacheKey, expiresAt);
    }

    /**
     * Invalidate cache entries containing a specific product ID
     * Called when a product is updated
     *
     * @param productId Product ID
     */
    @Transactional
    public void invalidateByProductId(Long productId) {
        int deleted = responseCacheRepository.deleteByProductId(productId);
        log.info("Invalidated {} cache entries for product ID: {}", deleted, productId);
    }

    /**
     * Clean up expired cache entries (runs daily at 2 AM)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredCache() {
        int deleted = responseCacheRepository.deleteExpiredCache(LocalDateTime.now());
        log.info("Cleaned up {} expired cache entries", deleted);
    }

    /**
     * Clear all cache entries
     */
    @Transactional
    public void clearAllCache() {
        responseCacheRepository.deleteAll();
        log.info("Cleared all cache entries");
    }

    /**
     * Get top N most popular cached queries (for analytics)
     */
    public List<ResponseCacheEntity> getTopCachedQueries(int limit) {
        return responseCacheRepository.findTop10ByOrderByHitCountDesc();
    }

    /**
     * Helper method to determine if a query is static (FAQ, policies, etc.)
     * This is a simple implementation - can be enhanced with NLP/pattern matching
     */
    public boolean isStaticQuery(String query) {
        String normalized = query.toLowerCase();

        String[] staticKeywords = {
                "return policy", "warranty", "shipping", "payment",
                "support", "contact", "hours", "location",
                "refund", "exchange", "delivery", "installation"
        };

        for (String keyword : staticKeywords) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }

        return false;
    }
}
