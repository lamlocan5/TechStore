import { paymentClient } from "./payment.client";
import type { CreatePaymentRequest, CreatePaymentResponse, PaymentReturnResponse } from "@/types/payment";

/**
 * Create VNPay payment URL
 */
export const createPaymentUrl = async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await paymentClient.post<CreatePaymentResponse>("/create-payment", data);
    return response.data;
};

/**
 * Process VNPay return callback
 * @param queryString Full query string from VNPay return URL
 */
export const processVNPayReturn = async (queryString: string): Promise<PaymentReturnResponse> => {
    const response = await paymentClient.get<PaymentReturnResponse>(`/payment-return?${queryString}`);
    return response.data;
};
