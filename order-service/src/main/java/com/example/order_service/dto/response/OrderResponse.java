package com.example.order_service.dto.response;

import com.example.order_service.enums.OrderStatus;
import com.example.order_service.enums.PaymentMethod;
import com.example.order_service.enums.PaymentStatus;
import com.example.order_service.enums.OrderType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    Long id;
    String userId;
    Long addressId;
    Long voucherId;
    OrderStatus status;
    OrderType orderType;
    PaymentMethod paymentMethod;
    PaymentStatus paymentStatus;
    Long subtotal;
    Long discount;
    Long shippingFee;
    Long total;
    String note;
    LocalDateTime createdAt;
    LocalDateTime paidAt;
    LocalDateTime shippedAt;
    LocalDateTime completedAt;
    LocalDateTime cancelledAt;
    List<OrderItemResponse> items;
}

