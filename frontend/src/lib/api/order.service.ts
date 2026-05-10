import { apiClient } from "./client";
import { paymentClient } from "./payment.client";
import type {
    Order,
    CreateOrderRequest,
    CreateOrderResponse,
    OrderListResponse,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentReturnResponse,
    SalesStatistics,
    VariantSoldData
} from "@/types/order";

/**
 * Order Management APIs
 */

// Create a new order
export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<CreateOrderResponse>("/orders", data);
    return response.data.result;
};

// Get order by ID
export const getOrderById = async (id: number): Promise<Order> => {
    const response = await apiClient.get<CreateOrderResponse>(`/orders/${id}`);
    return response.data.result;
};

// Get all orders (Admin only)
export const getAllOrders = async (params?: {
    page?: number;
    limit?: number;
}): Promise<OrderListResponse["result"]> => {
    const response = await apiClient.get<OrderListResponse>("/orders", { params });
    return response.data.result;
};

// Get my orders
export const getMyOrders = async (params?: {
    page?: number;
    limit?: number;
}): Promise<OrderListResponse["result"]> => {
    const response = await apiClient.get<OrderListResponse>("/orders/my-orders", { params });
    return response.data.result;
};

// Get orders by user ID
export const getOrdersByUserId = async (
    userId: string,
    params?: { page?: number; limit?: number }
): Promise<OrderListResponse["result"]> => {
    const response = await apiClient.get<OrderListResponse>(`/orders/user/${userId}`, { params });
    return response.data.result;
};

// Get orders by status
export const getOrdersByStatus = async (
    status: string,
    params?: { page?: number; limit?: number }
): Promise<OrderListResponse["result"]> => {
    const response = await apiClient.get<OrderListResponse>(`/orders/status/${status}`, { params });
    return response.data.result;
};

// Get orders by user ID and status
export const getOrdersByUserIdAndStatus = async (
    userId: string,
    status: string,
    params?: { page?: number; limit?: number }
): Promise<OrderListResponse["result"]> => {
    const response = await apiClient.get<OrderListResponse>(
        `/orders/user/${userId}/status/${status}`,
        { params }
    );
    return response.data.result;
};

// Update order status (Admin only)
export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
    const response = await apiClient.put<CreateOrderResponse>(
        `/orders/${id}/status`,
        null,
        { params: { status } }
    );
    return response.data.result;
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (id: number, status: string): Promise<Order> => {
    const response = await apiClient.put<CreateOrderResponse>(
        `/orders/${id}/payment-status`,
        null,
        { params: { status } }
    );
    return response.data.result;
};

// Cancel order
export const cancelOrder = async (id: number): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
};

// Get sales statistics (Admin only)
export const getSalesStatistics = async (): Promise<SalesStatistics> => {
    const response = await apiClient.get<{ code: number; message: string; result: SalesStatistics }>(
        "/orders/statistics/sales"
    );
    return response.data.result;
};

// Get variant sold data (Admin only)
export const getVariantSoldData = async (): Promise<VariantSoldData[]> => {
    const response = await apiClient.get<{
        code: number;
        message: string;
        result: { variants: VariantSoldData[] };
    }>("/orders/statistics/variant-sold");
    return response.data.result.variants;
};