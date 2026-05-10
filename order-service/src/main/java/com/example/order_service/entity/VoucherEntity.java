package com.example.order_service.entity;

import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 50)
    String code;

    @Column(length = 150)
    String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    DiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    Long discountValue;

    @Column(name = "discount_max_value")
    Long discountMaxValue;

    @Column(name = "min_order_total")
    Long minOrderTotal = 0L;

    @Column(name = "start_at", nullable = false)
    LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    LocalDateTime endAt;

    @Column(name = "max_usage")
    Integer maxUsage;

    @Column(name = "max_per_user")
    Integer maxPerUser = 1;

    @Column(nullable = false)
    Integer status = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "min_rank_required", nullable = false, length = 20)
    MembershipRank minRankRequired = MembershipRank.BRONZE;
}

