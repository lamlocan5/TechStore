import { create } from "zustand";
import * as addressService from "@/lib/api/address.service";
import type { Address } from "@/types/address";
import { toast } from "sonner";

interface AddressState {
    addresses: Address[];
    isLoading: boolean;

    // Actions
    fetchAddresses: () => Promise<void>;
    addAddress: (data: Omit<Address, "id" | "userId">) => Promise<void>;
    updateAddress: (id: number, data: Partial<Address>) => Promise<void>;
    deleteAddress: (id: number) => Promise<void>;
    setDefaultAddress: (id: number) => Promise<void>;
}

export const useAddressStore = create<AddressState>()((set, get) => ({
    addresses: [],
    isLoading: false,

    fetchAddresses: async () => {
        try {
            set({ isLoading: true });
            const addresses = await addressService.getMyAddresses();
            set({ addresses, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            console.error("Fetch addresses error:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách địa chỉ");
        }
    },

    addAddress: async (data) => {
        try {
            set({ isLoading: true });
            const newAddress = await addressService.createAddress(data);
            set((state) => ({
                addresses: [...state.addresses, newAddress],
                isLoading: false,
            }));
            toast.success("Đã thêm địa chỉ mới");
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể thêm địa chỉ";
            toast.error(message);
            throw error;
        }
    },

    updateAddress: async (id, data) => {
        try {
            set({ isLoading: true });
            const updatedAddress = await addressService.updateAddress(id, data);
            set((state) => ({
                addresses: state.addresses.map((addr) =>
                    addr.id === id ? updatedAddress : addr
                ),
                isLoading: false,
            }));
            toast.success("Đã cập nhật địa chỉ");
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể cập nhật địa chỉ";
            toast.error(message);
            throw error;
        }
    },

    deleteAddress: async (id) => {
        try {
            set({ isLoading: true });
            await addressService.deleteAddress(id);
            set((state) => ({
                addresses: state.addresses.filter((addr) => addr.id !== id),
                isLoading: false,
            }));
            toast.success("Đã xóa địa chỉ");
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể xóa địa chỉ";
            toast.error(message);
            throw error;
        }
    },

    setDefaultAddress: async (id) => {
        try {
            set({ isLoading: true });
            await addressService.setDefaultAddress(id);
            set((state) => ({
                addresses: state.addresses.map((addr) => ({
                    ...addr,
                    isDefault: addr.id === id,
                })),
                isLoading: false,
            }));
            toast.success("Đã đặt làm địa chỉ mặc định");
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.message || "Không thể đặt địa chỉ mặc định";
            toast.error(message);
            throw error;
        }
    },
}));
