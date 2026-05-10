import { Order } from "@/types";

export const mockOrders: Order[] = [
    {
        id: "ORD-2024-001",
        userId: "user-1",
        items: [
            {
                productId: "1",
                productName: "Laptop Dell XPS 13",
                quantity: 1,
                price: 25990000,
                variant: { color: "Bạc", size: '13"' },
            },
        ],
        totalAmount: 25990000,
        status: "DELIVERED",
        shippingAddress: {
            fullName: "Nguyễn Văn A",
            phone: "0901234567",
            address: "123 Nguyễn Huệ",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
        },
        paymentMethod: "COD",
        createdAt: "2024-12-01T10:30:00Z",
        updatedAt: "2024-12-05T14:20:00Z",
        deliveredAt: "2024-12-05T14:20:00Z",
    },
    {
        id: "ORD-2024-002",
        userId: "user-1",
        items: [
            {
                productId: "2",
                productName: "iPhone 15 Pro Max",
                quantity: 1,
                price: 31990000,
                variant: { color: "Titan Tự Nhiên", size: "256GB" },
            },
            {
                productId: "3",
                productName: "AirPods Pro 2",
                quantity: 1,
                price: 6490000,
                variant: {},
            },
        ],
        totalAmount: 38480000,
        status: "SHIPPING",
        shippingAddress: {
            fullName: "Nguyễn Văn A",
            phone: "0901234567",
            address: "123 Nguyễn Huệ",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
        },
        paymentMethod: "VNPAY",
        createdAt: "2024-12-08T09:15:00Z",
        updatedAt: "2024-12-10T16:45:00Z",
        shippedAt: "2024-12-10T16:45:00Z",
    },
    {
        id: "ORD-2024-003",
        userId: "user-1",
        items: [
            {
                productId: "4",
                productName: "MacBook Pro 14 M3",
                quantity: 1,
                price: 45990000,
                variant: { color: "Xám", size: '14"' },
            },
        ],
        totalAmount: 45990000,
        status: "PROCESSING",
        shippingAddress: {
            fullName: "Nguyễn Văn A",
            phone: "0901234567",
            address: "123 Nguyễn Huệ",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
        },
        paymentMethod: "BANK_TRANSFER",
        createdAt: "2024-12-11T14:20:00Z",
        updatedAt: "2024-12-11T14:20:00Z",
    },
    {
        id: "ORD-2024-004",
        userId: "user-1",
        items: [
            {
                productId: "5",
                productName: "Samsung Galaxy S24 Ultra",
                quantity: 1,
                price: 29990000,
                variant: { color: "Titan Đen", size: "512GB" },
            },
        ],
        totalAmount: 29990000,
        status: "PENDING",
        shippingAddress: {
            fullName: "Nguyễn Văn A",
            phone: "0901234567",
            address: "123 Nguyễn Huệ",
            ward: "Phường Bến Nghé",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
        },
        paymentMethod: "COD",
        createdAt: "2024-12-11T18:00:00Z",
        updatedAt: "2024-12-11T18:00:00Z",
    },
];

export const getOrdersByUserId = (userId: string): Order[] => {
    return mockOrders.filter(order => order.userId === userId);
};

export const getOrderById = (orderId: string): Order | undefined => {
    return mockOrders.find(order => order.id === orderId);
};
