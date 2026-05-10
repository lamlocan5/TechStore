// Order Types
export type OrderType = "NORMAL" | "PREORDER";

export interface Order {
    id: number;
    userId: string;
    addressId: number;
    voucherId?: number;
    orderType?: OrderType;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    note?: string;
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    items: OrderItem[];
}

export interface OrderItem {
    productId: number;
    variantId: number;
    productName: string;
    sku: string;
    attributesName: string;
    size?: string;
    color?: string;
    price: number;
    quantity: number;
    total: number;
}

export type OrderStatus =
    | "PENDING"
    | "PAID"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED";

export type PaymentStatus =
    | "UNPAID"
    | "PAID"
    | "REFUNDED"
    | "FAILED";

export type PaymentMethod =
    | "COD"
    | "VNPAY"
    | "MOMO";

// Vietnamese Labels for Order Status
export const OrderStatusLabels: Record<OrderStatus, string> = {
    PENDING: "Đang xử lý",
    PAID: "Đã thanh toán",
    SHIPPING: "Đang giao hàng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy"
};

// Vietnamese Labels for Payment Status
export const PaymentStatusLabels: Record<PaymentStatus, string> = {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    REFUNDED: "Đã hoàn tiền",
    FAILED: "Thanh toán thất bại"
};

// Vietnamese Labels for Payment Method
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
    COD: "Thanh toán khi nhận hàng",
    VNPAY: "VNPay",
    MOMO: "MoMo"
};

// Vietnamese Labels for Order Type
export const OrderTypeLabels: Record<OrderType, string> = {
    NORMAL: "Đơn hàng thường",
    PREORDER: "Đặt trước"
};

export interface CreateOrderRequest {
    addressId: number;
    voucherCode?: string;
    paymentMethod: PaymentMethod;
    shippingFee: number;
    note?: string;
    preorder?: boolean; // Set to true for preorder items
    items: {
        productId: number;
        variantId: number;
        productName: string;
        sku: string;
        attributesName: string;
        quantity: number;
        price: number;
    }[];
}

export interface CreateOrderResponse {
    code: number;
    message: string;
    result: Order;
}

export interface OrderListResponse {
    code: number;
    message: string;
    result: {
        result: Order[];
        total: number;
        page: number;
        size: number;
        totalPages: number;
    };
}

// VNPay Payment Types
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
    transactionId: string;
    amount: number;
    responseCode: string;
    responseMessage: string;
}

// Order Statistics (Admin)
export interface SalesStatistics {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    averageOrderValue: number;
}

export interface VariantSoldData {
    variantId: number;
    productName: string;
    size?: string;
    color?: string;
    totalSold: number;
    totalRevenue: number;
}
