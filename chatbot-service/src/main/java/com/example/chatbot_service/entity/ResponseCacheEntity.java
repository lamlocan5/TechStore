package com.example.chatbot_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chatbot_response_cache", indexes = {
    @Index(name = "idx_expires", columnList = "expires_at"),
    @Index(name = "idx_hit_count", columnList = "hit_count")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseCacheEntity {

    @Id
    @Column(name = "cache_key", length = 64)
    private String cacheKey;

    @Column(name = "query_normalized", length = 255)
    private String queryNormalized;

    @Column(name = "response_text", columnDefinition = "TEXT", nullable = false)
    private String responseText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "product_ids", columnDefinition = "JSON")
    private List<Long> productIds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "hit_count", nullable = false)
    @Builder.Default
    private Integer hitCount = 0;

    // Helper method to increment hit count
    public void incrementHitCount() {
        this.hitCount++;
    }

    // Helper method to check if cache is expired
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
