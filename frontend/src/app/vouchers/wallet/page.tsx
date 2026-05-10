"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Loader2, ArrowLeft, Ticket, ShoppingCart, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth.store";
import { getMyWalletWithDetails, formatVoucherDiscount, isVoucherValid } from "@/lib/api/voucher.service";
import type { UserVoucher } from "@/types/voucher";
import Link from "next/link";

export default function VoucherWalletPage() {
    const router = useRouter();
    const { isAuthenticated, hasHydrated } = useAuthStore();
    const [wallet, setWallet] = useState<UserVoucher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/vouchers/wallet");
            return;
        }
        fetchWallet();
    }, [isAuthenticated, hasHydrated, router]);

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const data = await getMyWalletWithDetails();
            setWallet(data);
        } catch (error) {
            console.error("Error fetching wallet:", error);
        } finally {
            setLoading(false);
        }
    };

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

    // Separate valid and expired/used vouchers
    const validVouchers = wallet.filter(w => !w.isUsed && w.voucher && isVoucherValid(w.voucher));
    const expiredOrUsed = wallet.filter(w => w.isUsed || !w.voucher || !isVoucherValid(w.voucher!));

    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                        <Link href="/vouchers">
                            <Button variant="outline" className="gap-2">
                                <Ticket className="h-4 w-4" />
                                Lấy thêm mã
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Wallet className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Ví voucher của tôi</h1>
                            <p className="text-gray-600">
                                {validVouchers.length} mã có thể sử dụng
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : wallet.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-white rounded-2xl border-2 border-gray-200"
                    >
                        <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Ví của bạn đang trống
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Hãy thu thập mã giảm giá để sử dụng
                        </p>
                        <Link href="/vouchers">
                            <Button className="gap-2">
                                <Ticket className="h-4 w-4" />
                                Lấy mã ngay
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Valid Vouchers */}
                        {validVouchers.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Có thể sử dụng ({validVouchers.length})
                                </h2>
                                <div className="space-y-3">
                                    {validVouchers.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-xl border-2 border-green-200 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-gray-900">
                                                            {item.voucher?.name}
                                                        </p>
                                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                                            Còn hiệu lực
                                                        </Badge>
                                                    </div>
                                                    <p className="text-primary font-semibold">
                                                        {item.voucher && formatVoucherDiscount(item.voucher)}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                            {item.voucher?.code}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            HSD: {item.voucher && formatDate(item.voucher.endAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Đơn tối thiểu: {item.voucher && formatPrice(item.voucher.minOrderTotal)}đ
                                                    </p>
                                                </div>
                                                <Link href="/cart">
                                                    <Button size="sm" className="gap-1">
                                                        <ShoppingCart className="h-4 w-4" />
                                                        Dùng ngay
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expired/Used Vouchers */}
                        {expiredOrUsed.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                                    <X className="h-4 w-4 text-gray-400" />
                                    Đã sử dụng / Hết hạn ({expiredOrUsed.length})
                                </h2>
                                <div className="space-y-3 opacity-60">
                                    {expiredOrUsed.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-600 line-through">
                                                        {item.voucher?.name || `Voucher #${item.voucherId}`}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {item.isUsed ? "Đã sử dụng" : "Hết hạn"}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.isUsed ? "Đã dùng" : "Hết hạn"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
