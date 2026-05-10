package com.example.chatbot_service.repository;

import com.example.chatbot_service.entity.RateLimitEntity;
import com.example.chatbot_service.entity.RateLimitEntity.IdentifierType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RateLimitRepository extends JpaRepository<RateLimitEntity, Long> {

    Optional<RateLimitEntity> findByIdentifierAndIdentifierTypeAndWindowStart(
        String identifier,
        IdentifierType identifierType,
        LocalDateTime windowStart
    );

    @Modifying
    @Query("DELETE FROM RateLimitEntity r WHERE r.windowStart < :cutoff")
    int deleteOldEntries(@Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COALESCE(SUM(r.requestCount), 0) FROM RateLimitEntity r " +
           "WHERE r.identifier = :identifier " +
           "AND r.identifierType = :identifierType " +
           "AND r.windowStart >= :startTime")
    int sumRequestCountsByIdentifierAndTypeAfter(
        @Param("identifier") String identifier,
        @Param("identifierType") IdentifierType identifierType,
        @Param("startTime") LocalDateTime startTime
    );
}
