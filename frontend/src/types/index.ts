// API Response wrapper
export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
}

// Paginated Response
export interface PaginatedResponse<T> {
    result: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

// Permission & Role Types
export interface Permission {
    name: string;
    description: string;
}

export interface Role {
    name: string;
    description: string;
    permissions: Permission[];
}

// User & Auth Types
export interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    dob: string;
    roles: Role[];
    totalSpent?: number;
    rank?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    authenticated: boolean;
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: string[]; // API returns string[], we map to Role[]
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    dob: string;
    email?: string;
    phone?: string;
    avatar?: string;
    status?: number;
    roles?: string[];
}

// Product Types
export interface Product {
    id: number;
    categoryIds: number[];
    brandId: number;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    priceList: number;
    priceSale: number;
    avatar: string;
    images: string; // Comma-separated string
    status: boolean;
    firstImage: string;
    createdAt: string;
    updatedAt: string;
    variants: ProductVariant[];
    // Populated fields (not from API but useful for UI)
    brand?: Brand;
    categories?: Category[];
}

export interface ProductVariant {
    id: number;
    productId: number;
    sku: string;
    color?: string;
    ramGb?: number;
    storageGb?: number;
    cpuModel?: string;
    igpu?: string;
    gpuModel?: string;
    chipsetModel?: string;
    os?: string;
    priceList: number;
    priceSale: number;
    stock: number;
    weightG?: number;
    createdAt: string;
    updatedAt: string;
    allowPreorder?: boolean;
    specs?: VariantSpec[];
    // Legacy fields for backwards compatibility
    price?: number;
    size?: string;
    image?: string;
}

export interface VariantSpec {
    id: string;
    productVariantId: number;
    specAttributeId: number;
    attributeKey: string;
    attributeLabel: string;
    value: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string;
    logo: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

// Cart Types
export interface Cart {
    id: number;
    userId: string;
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    id: number;
    productId: number;
    variantId: number;
    quantity: number;
    priceSnapshot: number;
    attributesName?: string;
}

export interface AddToCartRequest {
    productId: number;
    variantId: number;
    quantity: number;
    price: number;
    attributesName?: string;
    silent?: boolean; // If true, don't show toast (for Buy Now flow)
}

export interface UpdateCartItemRequest {
    quantity: number;
}

// Order Types
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "CASH_ON_DELIVERY" | "BANK_TRANSFER";

export interface Order {
    id: number;
    userId: string;
    addressId?: number;
    voucherId?: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    note?: string;
    items: OrderItem[];
    createdAt: string;
    paidAt?: string | null;
    shippedAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
}

export interface OrderItem {
    id: number;
    variantId: number;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface CreateOrderRequest {
    addressId?: number;
    voucherCode?: string;
    paymentMethod: PaymentMethod;
    shippingFee: number;
    note?: string;
    items: {
        variantId: number;
        quantity: number;
        price: number;
    }[];
}

// Voucher Types
export interface Voucher {
    id: number;
    code: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// Address Type (Mock - no API available)
export interface Address {
    id: number;
    userId: string;
    fullName: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
    isDefault: boolean;
}

// Spec Attributes & Variant Specs
export interface SpecAttribute {
    id: number;
    label: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export interface VariantSpec {
    id: string;
    productVariantId: number;
    specAttributeId: number;
    attributeKey: string;
    attributeLabel: string;
    value: string;
}

// Chatbot Types
export interface ChatMessage {
    id: number;
    role: "USER" | "ASSISTANT";
    content: string;
    productIds?: number[];
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface ChatMessageRequest {
    sessionId: string | null;
    content: string;
}

export interface ChatMessageResponse {
    sessionId: string;
    message: ChatMessage;
}

export interface Conversation {
    sessionId: string;
    userId: string;
    title: string;
    status: "ACTIVE" | "ARCHIVED";
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface ConversationListItem {
    sessionId: string;
    title: string;
    status: "ACTIVE" | "ARCHIVED";
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
}
