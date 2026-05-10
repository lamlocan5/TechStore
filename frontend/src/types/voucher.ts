// User Rank Types
export type UserRank = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export const RankThresholds: Record<UserRank, number> = {
    BRONZE: 0,
    SILVER: 10_000_000,
    GOLD: 40_000_000,
    DIAMOND: 100_000_000,
};

export const RankOrder: UserRank[] = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

export const RankLabels: Record<UserRank, string> = {
    BRONZE: "Đồng",
    SILVER: "Bạc",
    GOLD: "Vàng",
    DIAMOND: "Kim Cương",
};

export const RankColors: Record<UserRank, { bg: string; text: string; gradient: string }> = {
    BRONZE: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        gradient: "from-orange-400 to-amber-600",
    },
    SILVER: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        gradient: "from-gray-300 to-gray-500",
    },
    GOLD: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        gradient: "from-yellow-400 to-amber-500",
    },
    DIAMOND: {
        bg: "bg-cyan-100",
        text: "text-cyan-700",
        gradient: "from-cyan-300 to-blue-500",
    },
};

// Voucher Types
export interface Voucher {
    id: number;
    code: string;
    name: string;
    discountType: "PERCENT" | "AMOUNT";
    discountValue: number;
    discountMaxValue?: number | null;
    minOrderTotal: number;
    minRankRequired: UserRank;
    startAt: string;
    endAt: string;
    maxUsage: number;
    maxPerUser: number;
    status: number; // 1 = active, 0 = inactive
}

export interface UserVoucher {
    id: number;
    userId: string;
    voucherId: number;
    isUsed: boolean;
    claimedAt: string;
    usedAt?: string | null;
    voucher?: Voucher; // Optional joined data
}

// Helper functions
export function getNextRank(currentRank: UserRank): UserRank | null {
    const currentIndex = RankOrder.indexOf(currentRank);
    if (currentIndex === RankOrder.length - 1) return null;
    return RankOrder[currentIndex + 1];
}

export function getAmountToNextRank(currentRank: UserRank, totalSpent: number): number {
    const nextRank = getNextRank(currentRank);
    if (!nextRank) return 0;
    return RankThresholds[nextRank] - totalSpent;
}

export function getProgressToNextRank(currentRank: UserRank, totalSpent: number): number {
    const nextRank = getNextRank(currentRank);
    if (!nextRank) return 100;

    const currentThreshold = RankThresholds[currentRank];
    const nextThreshold = RankThresholds[nextRank];
    const progress = ((totalSpent - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

    return Math.min(Math.max(progress, 0), 100);
}

export function canUseVoucher(userRank: UserRank, voucherRank: UserRank): boolean {
    return RankOrder.indexOf(userRank) >= RankOrder.indexOf(voucherRank);
}
