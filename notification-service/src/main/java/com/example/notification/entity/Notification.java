package com.example.notification.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "channel", nullable = false)
    String channel;

    @Column(name = "recipient", nullable = false)
    String recipient;

    @Column(name = "template_code")
    String templateCode;

    @Column(name = "subject")
    String subject;

    @Column(name = "body", columnDefinition = "TEXT")
    String body;

    @Column(name = "html_content", columnDefinition = "LONGTEXT")
    String htmlContent;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    NotificationStatus status;

    @Column(name = "message_id")
    String messageId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum NotificationStatus {
        PENDING,
        SENT,
        FAILED
    }
}
