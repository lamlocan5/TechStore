import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as cartService from "@/lib/api/cart.service";
import type { Cart, AddToCartRequest } from "@/types";
import { toast } from "sonner";

interface CartState {
    cart: Cart | null;
    isLoading: boolean;
    selectedItemIds: number[]; // IDs of selected items for checkout

    // Actions
    fetchCart: () => Promise<void>;
    addItem: (data: AddToCartRequest) => Promise<void>;
    updateItem: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    removeSelectedItems: () => Promise<void>;

    // Selection actions
    toggleItemSelection: (itemId: number) => void;
    selectAllItems: () => void;
    clearSelection: () => void;
    setSelectedItemIds: (ids: number[]) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            cart: null,
            isLoading: false,
            selectedItemIds: [],

            fetchCart: async () => {
                try {
                    set({ isLoading: true });
                    const cart = await cartService.getMyCart();
                    set({ cart, isLoading: false });
                } catch (error: any) {
                    set({ isLoading: false });
                    // Don't show error for empty cart
                    if (error.response?.status !== 404) {
                        console.error("Fetch cart error:", error);
                    }
                }
            },

            addItem: async (data: AddToCartRequest) => {
                try {
                    set({ isLoading: true });
                    const cart = await cartService.addToCart(data);
                    set({ cart, isLoading: false });
                    // Only show toast if not in silent mode (Buy Now doesn't need toast)
                    if (!data.silent) {
                        toast.success("Đã thêm vào giỏ hàng");
                    }
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Không thể thêm vào giỏ hàng";
                    toast.error(message);
                    throw error;
                }
            },

            updateItem: async (itemId: number, quantity: number) => {
                try {
                    set({ isLoading: true });
                    const cart = await cartService.updateCartItem(itemId, { quantity });
                    set({ cart, isLoading: false });
                    toast.success("Đã cập nhật giỏ hàng");
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Không thể cập nhật giỏ hàng";
                    toast.error(message);
                    throw error;
                }
            },

            removeItem: async (itemId: number) => {
                try {
                    set({ isLoading: true });
                    const cart = await cartService.removeFromCart(itemId);
                    set({ cart, isLoading: false });
                    toast.success("Đã xóa khỏi giỏ hàng");
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Không thể xóa khỏi giỏ hàng";
                    toast.error(message);
                    throw error;
                }
            },

            clearCart: async () => {
                try {
                    set({ isLoading: true });
                    await cartService.clearCart();
                    set({ cart: null, selectedItemIds: [], isLoading: false });
                    toast.success("Đã xóa toàn bộ giỏ hàng");
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Không thể xóa giỏ hàng";
                    toast.error(message);
                    throw error;
                }
            },

            removeSelectedItems: async () => {
                const state = useCartStore.getState();
                if (!state.cart || state.selectedItemIds.length === 0) {
                    return;
                }

                try {
                    set({ isLoading: true });

                    // Remove each selected item
                    for (const itemId of state.selectedItemIds) {
                        await cartService.removeFromCart(itemId);
                    }

                    // Refresh cart and clear selection
                    const cart = await cartService.getMyCart();
                    set({ cart, selectedItemIds: [], isLoading: false });
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Không thể xóa sản phẩm";
                    toast.error(message);
                    throw error;
                }
            },

            // Selection methods
            toggleItemSelection: (itemId: number) => {
                set((state) => {
                    const isSelected = state.selectedItemIds.includes(itemId);
                    return {
                        selectedItemIds: isSelected
                            ? state.selectedItemIds.filter(id => id !== itemId)
                            : [...state.selectedItemIds, itemId]
                    };
                });
            },

            selectAllItems: () => {
                set((state) => ({
                    selectedItemIds: state.cart?.items.map(item => item.id) || []
                }));
            },

            clearSelection: () => {
                set({ selectedItemIds: [] });
            },

            setSelectedItemIds: (ids: number[]) => {
                set({ selectedItemIds: ids });
            },
        }),
        {
            name: "cart-storage",
            partialize: (state) => ({
                cart: state.cart,
                selectedItemIds: state.selectedItemIds
            }),
        }
    )
);
