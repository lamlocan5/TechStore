package com.example.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReturnResponse {
    private boolean success;
    private String message;
    private String orderId;
    private String transactionId;
    private Long amount;
    private String responseCode;
    private String responseMessage;
}

