import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { Voucher, UserVoucher } from "@/types/voucher";

/**
 * Get vouchers available for current user's rank
 */
export async function getAvailableVouchers(): Promise<Voucher[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Voucher>>>("/vouchers/available-for-me");
    const result = response.data.result?.result;
    return Array.isArray(result) ? result : [];
}

/**
 * Get all active vouchers (for display with rank requirements)
 */
export async function getActiveVouchers(): Promise<Voucher[]> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Voucher>>>("/vouchers/active");
    const result = response.data.result?.result;
    return Array.isArray(result) ? result : [];
}

/**
 * Get voucher by ID
 */
export async function getVoucherById(id: number): Promise<Voucher> {
    const response = await apiClient.get<ApiResponse<Voucher>>(`/vouchers/${id}`);
    return response.data.result;
}

/**
 * Claim voucher to user's wallet
 */
export async function claimVoucher(id: number): Promise<void> {
    await apiClient.post(`/vouchers/${id}/claim`);
}

/**
 * Get user's voucher wallet (claimed vouchers)
 */
export async function getMyWallet(): Promise<UserVoucher[]> {
    const response = await apiClient.get<ApiResponse<UserVoucher[]>>("/vouchers/my-wallet");
    const result = response.data.result;
    return Array.isArray(result) ? result : [];
}

/**
 * Get wallet with voucher details
 */
export async function getMyWalletWithDetails(): Promise<UserVoucher[]> {
    const wallet = await getMyWallet();

    // Fetch voucher details for each item
    const walletWithDetails = await Promise.all(
        wallet.map(async (item) => {
            try {
                const voucher = await getVoucherById(item.voucherId);
                return { ...item, voucher };
            } catch {
                return item;
            }
        })
    );

    return walletWithDetails;
}

/**
 * Check if voucher is valid for use
 */
export function isVoucherValid(voucher: Voucher): boolean {
    const now = new Date();
    const startAt = new Date(voucher.startAt);
    const endAt = new Date(voucher.endAt);

    return voucher.status === 1 && now >= startAt && now <= endAt;
}

/**
 * Format voucher discount text
 */
export function formatVoucherDiscount(voucher: Voucher): string {
    if (voucher.discountType === "PERCENT") {
        let text = `Giảm ${voucher.discountValue}%`;
        if (voucher.discountMaxValue) {
            text += ` (tối đa ${new Intl.NumberFormat("vi-VN").format(voucher.discountMaxValue)}đ)`;
        }
        return text;
    }
    return `Giảm ${new Intl.NumberFormat("vi-VN").format(voucher.discountValue)}đ`;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(voucher: Voucher, subtotal: number): number {
    if (subtotal < voucher.minOrderTotal) return 0;

    if (voucher.discountType === "AMOUNT") {
        return voucher.discountValue;
    }

    // PERCENT
    let discount = (subtotal * voucher.discountValue) / 100;
    if (voucher.discountMaxValue) {
        discount = Math.min(discount, voucher.discountMaxValue);
    }
    return discount;
}
