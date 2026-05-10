package com.example.chatbot_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_rate_limits",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_ratelimit",
        columnNames = {"identifier", "identifier_type", "window_start"}
    ),
    indexes = {
        @Index(name = "idx_window", columnList = "window_start")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identifier", nullable = false, length = 100)
    private String identifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "identifier_type", nullable = false)
    private IdentifierType identifierType;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private Integer requestCount = 0;

    public enum IdentifierType {
        USER, IP
    }

    // Helper method to increment request count
    public void incrementRequestCount() {
        this.requestCount++;
    }
}
