package com.example.payment.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private long amount;
    private String orderId;
}
