"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Award, Gem, TrendingUp } from "lucide-react";
import type { UserRank } from "@/types/voucher";
import {
    RankLabels,
    getNextRank,
    getAmountToNextRank,
    getProgressToNextRank,
    RankThresholds
} from "@/types/voucher";

interface RankBadgeProps {
    rank: UserRank;
    totalSpent?: number;
    showProgress?: boolean;
    size?: "sm" | "md" | "lg";
}

// Better color scheme with dark backgrounds
const RankStyles: Record<UserRank, { bg: string; accent: string; icon: string; progress: string }> = {
    BRONZE: {
        bg: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200",
        accent: "text-orange-600",
        icon: "bg-orange-100 text-orange-600",
        progress: "bg-orange-500",
    },
    SILVER: {
        bg: "bg-gradient-to-br from-gray-50 to-slate-100 border-gray-300",
        accent: "text-gray-700",
        icon: "bg-gray-200 text-gray-600",
        progress: "bg-gray-500",
    },
    GOLD: {
        bg: "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300",
        accent: "text-yellow-700",
        icon: "bg-yellow-100 text-yellow-600",
        progress: "bg-yellow-500",
    },
    DIAMOND: {
        bg: "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300",
        accent: "text-blue-700",
        icon: "bg-blue-100 text-blue-600",
        progress: "bg-blue-500",
    },
};

const RankIcons: Record<UserRank, React.ReactNode> = {
    BRONZE: <Medal className="h-full w-full" />,
    SILVER: <Medal className="h-full w-full" />,
    GOLD: <Crown className="h-full w-full" />,
    DIAMOND: <Gem className="h-full w-full" />,
};

const RankEmojis: Record<UserRank, string> = {
    BRONZE: "🥉",
    SILVER: "🥈",
    GOLD: "🥇",
    DIAMOND: "💎",
};

export function RankBadge({ rank, totalSpent = 0, showProgress = false, size = "md" }: RankBadgeProps) {
    const styles = RankStyles[rank];
    const nextRank = getNextRank(rank);
    const progress = getProgressToNextRank(rank, totalSpent);
    const amountToNext = getAmountToNextRank(rank, totalSpent);

    const sizeClasses = {
        sm: { container: "p-3", icon: "h-8 w-8", text: "text-xs", title: "text-sm" },
        md: { container: "p-4", icon: "h-10 w-10", text: "text-sm", title: "text-base" },
        lg: { container: "p-5", icon: "h-12 w-12", text: "text-base", title: "text-lg" },
    };

    const s = sizeClasses[size];

    const formatPrice = (price: number) => {
        if (price >= 1_000_000) {
            return `${(price / 1_000_000).toFixed(1)} triệu`;
        }
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${styles.bg} rounded-xl ${s.container} border-2 shadow-sm`}
        >
            <div className="flex items-center gap-3">
                {/* Rank Icon with Emoji */}
                <div className={`${s.icon} ${styles.icon} rounded-full p-2 flex items-center justify-center`}>
                    {RankIcons[rank]}
                </div>

                {/* Rank Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{RankEmojis[rank]}</span>
                        <p className={`font-bold ${s.title} ${styles.accent}`}>
                            Hạng {RankLabels[rank]}
                        </p>
                    </div>
                    <p className={`${s.text} text-gray-600`}>
                        Đã chi tiêu: {formatPrice(totalSpent)} vnd
                    </p>
                </div>
            </div>

            {/* Progress to Next Rank */}
            {showProgress && nextRank && (
                <div className="mt-4">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className={`h-4 w-4 ${styles.accent}`} />
                        <span className={`${s.text} text-gray-600`}>
                            Tiến độ lên {RankLabels[nextRank]}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full ${styles.progress} rounded-full`}
                        />
                    </div>
                    <p className={`${s.text} text-gray-500 mt-1.5`}>
                        Còn <span className={`font-semibold ${styles.accent}`}>{formatPrice(amountToNext)} vnd</span> nữa
                    </p>
                </div>
            )}

            {/* Max Rank */}
            {showProgress && !nextRank && (
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    <p className={`${s.text} ${styles.accent} font-medium`}>
                        Bạn đã đạt hạng cao nhất!
                    </p>
                </div>
            )}
        </motion.div>
    );
}

// Compact inline badge for headers
export function RankBadgeInline({ rank }: { rank: UserRank }) {
    const styles = RankStyles[rank];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${styles.bg} border text-xs font-semibold ${styles.accent}`}>
            <span>{RankEmojis[rank]}</span>
            {RankLabels[rank]}
        </span>
    );
}
