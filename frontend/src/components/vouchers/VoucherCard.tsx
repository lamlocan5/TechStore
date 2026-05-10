"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Clock, Lock, Check, Loader2, Tag, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RankBadgeInline } from "@/components/profile/RankBadge";
import type { Voucher, UserRank } from "@/types/voucher";
import { canUseVoucher, RankLabels } from "@/types/voucher";
import { claimVoucher, isVoucherValid, formatVoucherDiscount } from "@/lib/api/voucher.service";
import { toast } from "sonner";

interface VoucherCardProps {
    voucher: Voucher;
    userRank: UserRank;
    isClaimed?: boolean;
    onClaimed?: () => void;
}

export function VoucherCard({ voucher, userRank, isClaimed = false, onClaimed }: VoucherCardProps) {
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(isClaimed);

    const isValid = isVoucherValid(voucher);
    const canUse = canUseVoucher(userRank, voucher.minRankRequired);
    const isDisabled = !isValid || !canUse || claimed;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    const handleClaim = async () => {
        if (isDisabled) return;

        try {
            setClaiming(true);
            await claimVoucher(voucher.id);
            setClaimed(true);
            toast.success("Đã lấy mã thành công!");
            onClaimed?.();
        } catch (error: any) {
            const code = error.response?.data?.code;
            const message = error.response?.data?.message;

            if (code === 4007) {
                toast.error("Hạng thành viên không đủ để lấy mã này");
            } else if (code === 4005) {
                toast.error("Mã đã hết lượt sử dụng");
            } else if (code === 4006) {
                toast.error("Bạn đã lấy mã này rồi");
                setClaimed(true);
            } else {
                toast.error(message || "Không thể lấy mã, vui lòng thử lại");
            }
        } finally {
            setClaiming(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative overflow-hidden rounded-xl border-2 transition-all
                ${isDisabled
                    ? "bg-gray-50 border-gray-200 opacity-75"
                    : "bg-white border-primary/20 hover:border-primary/40 hover:shadow-md"
                }
            `}
        >
            {/* Ticket decoration */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full border-2 border-gray-200" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full border-2 border-gray-200" />

            <div className="p-4 pl-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isDisabled ? "bg-gray-200" : "bg-primary/10"}`}>
                            <Ticket className={`h-5 w-5 ${isDisabled ? "text-gray-400" : "text-primary"}`} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{voucher.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{voucher.code}</p>
                        </div>
                    </div>

                    {claimed && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Đã lấy
                        </Badge>
                    )}
                </div>

                {/* Discount Value */}
                <div className="mb-3">
                    <p className={`text-lg font-bold ${isDisabled ? "text-gray-400" : "text-primary"}`}>
                        {formatVoucherDiscount(voucher)}
                    </p>
                </div>

                {/* Requirements */}
                <div className="space-y-1 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <ShoppingBag className="h-4 w-4" />
                        <span>Đơn tối thiểu: {formatPrice(voucher.minOrderTotal)}đ</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>HSD: {formatDate(voucher.endAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-600" />
                        <RankBadgeInline rank={voucher.minRankRequired} />
                        {!canUse && (
                            <span className="text-xs text-red-500">
                                (Yêu cầu hạng {RankLabels[voucher.minRankRequired]})
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                {!claimed ? (
                    <Button
                        onClick={handleClaim}
                        disabled={isDisabled || claiming}
                        className={`w-full ${isDisabled ? "bg-gray-300" : ""}`}
                    >
                        {claiming ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Đang lấy...
                            </>
                        ) : !canUse ? (
                            <>
                                <Lock className="h-4 w-4 mr-2" />
                                Yêu cầu hạng {RankLabels[voucher.minRankRequired]}
                            </>
                        ) : !isValid ? (
                            "Mã đã hết hạn"
                        ) : (
                            <>
                                <Ticket className="h-4 w-4 mr-2" />
                                Lấy mã
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => toast.info(`Mã: ${voucher.code} - Sử dụng khi thanh toán`)}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Đã lưu vào ví
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
