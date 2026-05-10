package com.example.chatbot_service.service;

import com.example.chatbot_service.entity.RateLimitEntity;
import com.example.chatbot_service.repository.RateLimitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private final RateLimitRepository rateLimitRepository;

    @Value("${app.ratelimit.per-user-per-minute:10}")
    private int perUserPerMinute;

    @Value("${app.ratelimit.per-user-per-day:100}")
    private int perUserPerDay;

    /**
     * Check if user has exceeded rate limit and increment counter
     *
     * @param userId User ID
     * @return true if request is allowed, false if rate limit exceeded
     */
    @Transactional
    public boolean checkAndIncrementRateLimit(String userId) {
        // Check per-minute limit
        if (!checkPerMinuteLimit(userId)) {
            log.warn("User {} exceeded per-minute rate limit", userId);
            return false;
        }

        // Check per-day limit
        if (!checkPerDayLimit(userId)) {
            log.warn("User {} exceeded per-day rate limit", userId);
            return false;
        }

        // Increment minute counter
        incrementCounter(userId, RateLimitEntity.IdentifierType.USER, 1, ChronoUnit.MINUTES);

        // Increment day counter
        incrementCounter(userId, RateLimitEntity.IdentifierType.USER, 1, ChronoUnit.DAYS);

        return true;
    }

    private boolean checkPerMinuteLimit(String userId) {
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minus(1, ChronoUnit.MINUTES);
        int requestCount = rateLimitRepository.sumRequestCountsByIdentifierAndTypeAfter(
                userId,
                RateLimitEntity.IdentifierType.USER,
                oneMinuteAgo
        );

        return requestCount < perUserPerMinute;
    }

    private boolean checkPerDayLimit(String userId) {
        LocalDateTime oneDayAgo = LocalDateTime.now().minus(1, ChronoUnit.DAYS);
        int requestCount = rateLimitRepository.sumRequestCountsByIdentifierAndTypeAfter(
                userId,
                RateLimitEntity.IdentifierType.USER,
                oneDayAgo
        );

        return requestCount < perUserPerDay;
    }

    @Transactional
    protected void incrementCounter(String identifier,
                                     RateLimitEntity.IdentifierType identifierType,
                                     long windowSize,
                                     ChronoUnit windowUnit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.truncatedTo(windowUnit);

        RateLimitEntity entity = rateLimitRepository
                .findByIdentifierAndIdentifierTypeAndWindowStart(
                        identifier, identifierType, windowStart
                )
                .orElseGet(() -> {
                    RateLimitEntity newEntity = RateLimitEntity.builder()
                            .identifier(identifier)
                            .identifierType(identifierType)
                            .windowStart(windowStart)
                            .requestCount(0)
                            .build();
                    return newEntity;
                });

        entity.incrementRequestCount();
        rateLimitRepository.save(entity);
    }

    /**
     * Clean up old rate limit entries (runs daily at 3 AM)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldEntries() {
        LocalDateTime twoDaysAgo = LocalDateTime.now().minus(2, ChronoUnit.DAYS);
        int deleted = rateLimitRepository.deleteOldEntries(twoDaysAgo);
        log.info("Cleaned up {} old rate limit entries", deleted);
    }
}
