export type PaymentMethod = "COD" | "VNPAY";

export interface CreatePaymentRequest {
    orderId: string;
    amount: number;
}

export interface CreatePaymentResponse {
    paymentUrl: string;
    orderId: string;
    amount: number;
    message: string;
}

export interface PaymentReturnResponse {
    success: boolean;
    message: string;
    orderId: string;
    transactionId?: string;
    amount?: number;
    responseCode: string;
    responseMessage: string;
}
