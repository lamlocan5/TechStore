package com.example.order_service.dto.request;

import com.example.order_service.enums.PaymentMethod;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderRequest {
    // userId will be extracted from JWT token, not from request
    Long addressId;
    String voucherCode;
    PaymentMethod paymentMethod;
    Long shippingFee;
    String note;
    Boolean preorder;
    List<OrderItemRequest> items;
}

