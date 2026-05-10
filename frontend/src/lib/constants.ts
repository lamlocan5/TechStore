export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Order Statuses
export const ORDER_STATUS = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

// Payment Statuses
export const PAYMENT_STATUS = {
    UNPAID: "UNPAID",
    PAID: "PAID",
    REFUNDED: "REFUNDED",
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
    UNPAID: "Unpaid",
    PAID: "Paid",
    REFUNDED: "Refunded",
};

// Payment Methods
export const PAYMENT_METHOD = {
    CREDIT_CARD: "CREDIT_CARD",
    DEBIT_CARD: "DEBIT_CARD",
    CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
    BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    CASH_ON_DELIVERY: "Cash on Delivery",
    BANK_TRANSFER: "Bank Transfer",
};

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
