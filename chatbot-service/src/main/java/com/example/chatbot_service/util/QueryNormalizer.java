package com.example.chatbot_service.util;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Component;

@Component
public class QueryNormalizer {

    /**
     * Normalize a query string for cache key generation
     * - Convert to lowercase
     * - Trim whitespace
     * - Replace multiple spaces with single space
     * - Remove some punctuation (but keep numbers intact for product searches)
     */
    public String normalize(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }

        return query.toLowerCase()
                .trim()
                .replaceAll("\\s+", " ")                          // Multiple spaces → single space
                .replaceAll("[?!,;:'\"]", "");                   // Remove punctuation (keep periods for decimals)
        // NOTE: Numbers are NOT normalized to preserve price/spec accuracy
        // "dưới 40 triệu" and "dưới 20 triệu" should have different cache keys
    }

    /**
     * Generate MD5 cache key from normalized query
     */
    public String generateCacheKey(String normalizedQuery) {
        return DigestUtils.md5Hex(normalizedQuery);
    }

    /**
     * Convenience method to normalize and generate cache key in one step
     */
    public String normalizeAndHash(String query) {
        String normalized = normalize(query);
        return generateCacheKey(normalized);
    }
}
