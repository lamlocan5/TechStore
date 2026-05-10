import { create } from "zustand";
import * as orderService from "@/lib/api/order.service";
import { useAuthStore } from "@/lib/store/auth.store";
import type { Order, CreateOrderRequest, OrderListResponse, OrderStatus } from "@/types/order";
import { toast } from "sonner";

interface OrderState {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        size: number;
        totalPages: number;
    } | null;
    statusCounts: {
        PENDING: number;
        PAID: number;
        SHIPPING: number;
        COMPLETED: number;
        CANCELLED: number;
    };

    // Actions
    fetchOrders: (params?: { page?: number; limit?: number }) => Promise<void>;
    fetchOrdersByStatus: (status: OrderStatus, params?: { page?: number; limit?: number }) => Promise<void>;
    fetchOrderById: (id: number) => Promise<void>;
    createOrder: (data: CreateOrderRequest) => Promise<Order>;
    cancelOrder: (id: number) => Promise<void>;
    clearCurrentOrder: () => void;
    fetchStatusCounts: () => Promise<void>;
}

export const useOrderStore = create<OrderState>()((set) => ({
    orders: [],
    currentOrder: null,
    isLoading: false,
    pagination: null,
    statusCounts: {
        PENDING: 0,
        PAID: 0,
        SHIPPING: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    },

    fetchOrders: async (params) => {
        try {
            set({ isLoading: true });
            const data = await orderService.getMyOrders(params);
            set({
                orders: data.result,
                pagination: {
                    total: data.total,
                    page: data.page,
                    size: data.size,
                    totalPages: data.totalPages,
                },
                isLoading: false,
            });
        } catch (error: any) {
            set({ isLoading: false });
            console.error("Fetch orders error:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách đơn hàng");
        }
    },

    fetchOrdersByStatus: async (status, params) => {
        try {
            set({ isLoading: true });
            // Get current user ID from auth store
            const { user } = useAuthStore.getState();
            if (!user?.id) {
                throw new Error("User not authenticated");
            }

            const data = await orderService.getOrdersByUserIdAndStatus(user.username, status, params);
            set({
                orders: data.result,
                pagination: {
                    total: data.total,
                    page: data.page,
                    size: data.size,
                    totalPages: data.totalPages,
                },
                isLoading: false,
            });
        } catch (error: any) {
            set({ isLoading: false });
            console.error("Fetch orders by status error:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách đơn hàng");
        }
    },

    fetchOrderById: async (id) => {
        try {
            set({ isLoading: true });
            const order = await orderService.getOrderById(id);
            set({ currentOrder: order, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            console.error("Fetch order error:", error);
            toast.error(error.response?.data?.message || "Không thể tải thông tin đơn hàng");
        }
    },

    createOrder: async (data) => {
        try {
            set({ isLoading: true });
            const order = await orderService.createOrder(data);
            set((state) => ({
                orders: [order, ...state.orders],
                currentOrder: order,
                isLoading: false,
            }));
            toast.success("Đặt hàng thành công!");
            return order;
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể tạo đơn hàng";
            toast.error(message);
            throw error;
        }
    },

    cancelOrder: async (id) => {
        try {
            set({ isLoading: true });
            await orderService.cancelOrder(id);
            set((state) => ({
                orders: state.orders.map((order) =>
                    order.id === id
                        ? { ...order, status: "CANCELLED", cancelledAt: new Date().toISOString() }
                        : order
                ),
                currentOrder:
                    state.currentOrder?.id === id
                        ? { ...state.currentOrder, status: "CANCELLED", cancelledAt: new Date().toISOString() }
                        : state.currentOrder,
                isLoading: false,
            }));
            toast.success("Đã hủy đơn hàng");
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể hủy đơn hàng";
            toast.error(message);
            throw error;
        }
    },

    fetchStatusCounts: async () => {
        try {
            // Get current user from localStorage (since auth store is persisted)
            const authData = localStorage.getItem("auth-storage");
            if (!authData) return;

            const { state } = JSON.parse(authData);
            const userId = state?.user?.username;

            if (!userId) return;

            const statuses: OrderStatus[] = ["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELLED"];
            const counts = await Promise.all(
                statuses.map(async (status) => {
                    try {
                        const data = await orderService.getOrdersByUserIdAndStatus(
                            userId.toString(),
                            status,
                            { page: 1, limit: 1 }
                        );
                        return { status, count: data.total };
                    } catch {
                        return { status, count: 0 };
                    }
                })
            );

            const statusCounts = counts.reduce((acc, { status, count }) => {
                acc[status] = count;
                return acc;
            }, {} as OrderState["statusCounts"]);

            set({ statusCounts });
        } catch (error) {
            console.error("Fetch status counts error:", error);
        }
    },

    clearCurrentOrder: () => {
        set({ currentOrder: null });
    },
}));
