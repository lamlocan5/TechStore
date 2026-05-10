package com.example.order_service.dto.response;

import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherResponse {
    Long id;
    String code;
    String name;
    DiscountType discountType;
    Long discountValue;
    Long discountMaxValue;
    Long minOrderTotal;
    LocalDateTime startAt;
    LocalDateTime endAt;
    Integer maxUsage;
    Integer maxPerUser;
    Integer status;
    MembershipRank minRankRequired;
}

