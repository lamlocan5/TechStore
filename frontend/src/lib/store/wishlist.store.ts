import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem } from "@/types/product";

interface WishlistState {
    items: WishlistItem[];

    // Actions
    addToWishlist: (productId: number) => void;
    removeFromWishlist: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],

            addToWishlist: (productId: number) => {
                const { items, isInWishlist } = get();

                if (isInWishlist(productId)) {
                    return; // Already in wishlist
                }

                const newItem: WishlistItem = {
                    id: `wishlist-${Date.now()}`,
                    userId: "", // Will be set when user logs in
                    productId,
                    createdAt: new Date().toISOString(),
                };

                set({ items: [...items, newItem] });
            },

            removeFromWishlist: (productId: number) => {
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                }));
            },

            isInWishlist: (productId: number) => {
                return get().items.some((item) => item.productId === productId);
            },

            clearWishlist: () => {
                set({ items: [] });
            },
        }),
        {
            name: "wishlist-storage",
        }
    )
);
