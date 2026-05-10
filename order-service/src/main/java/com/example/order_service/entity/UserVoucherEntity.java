package com.example.order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVoucherEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false, length = 36)
    String userId;

    @Column(name = "voucher_id", nullable = false)
    Long voucherId;

    @Column(name = "is_used", nullable = false)
    Boolean isUsed = false;

    @Column(name = "claimed_at", nullable = false)
    LocalDateTime claimedAt;

    @Column(name = "used_at")
    LocalDateTime usedAt;

    @PrePersist
    protected void onCreate() {
        if (claimedAt == null) {
            claimedAt = LocalDateTime.now();
        }
    }
}


