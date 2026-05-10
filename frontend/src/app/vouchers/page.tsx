"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, Loader2, ArrowLeft, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoucherCard } from "@/components/vouchers/VoucherCard";
import { RankBadge } from "@/components/profile/RankBadge";
import { useAuthStore } from "@/lib/store/auth.store";
import { getActiveVouchers, getMyWallet } from "@/lib/api/voucher.service";
import type { Voucher, UserVoucher, UserRank } from "@/types/voucher";
import Link from "next/link";

export default function VouchersPage() {
    const router = useRouter();
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [wallet, setWallet] = useState<UserVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const userRank = (user?.rank as UserRank) || "BRONZE";
    const totalSpent = user?.totalSpent || 0;

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/vouchers");
            return;
        }
        fetchData();
    }, [isAuthenticated, hasHydrated, router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vouchersData, walletData] = await Promise.all([
                getActiveVouchers().catch((e) => { console.error("getActiveVouchers error:", e); return []; }),
                getMyWallet().catch((e) => { console.error("getMyWallet error:", e); return []; }),
            ]);
            console.log("Vouchers data:", vouchersData);
            console.log("Wallet data:", walletData);
            setVouchers(vouchersData || []);
            setWallet(walletData || []);
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setVouchers([]);
            setWallet([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const isVoucherClaimed = (voucherId: number) => {
        return wallet.some(w => w.voucherId === voucherId);
    };

    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>
                            <Link href="/vouchers/wallet">
                                <Button variant="outline" className="gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Ví của tôi
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Ticket className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mã giảm giá</h1>
                            <p className="text-gray-600">Thu thập mã giảm giá cho đơn hàng của bạn</p>
                        </div>
                    </div>

                    {/* User Rank Badge */}
                    <RankBadge rank={userRank} totalSpent={totalSpent} showProgress size="md" />
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="available" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="available">Có thể lấy</TabsTrigger>
                            <TabsTrigger value="all">Tất cả ({vouchers.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="available">
                            <div className="grid gap-4 md:grid-cols-2">
                                {vouchers
                                    .filter(v => !isVoucherClaimed(v.id))
                                    .map((voucher) => (
                                        <VoucherCard
                                            key={voucher.id}
                                            voucher={voucher}
                                            userRank={userRank}
                                            isClaimed={false}
                                            onClaimed={handleRefresh}
                                        />
                                    ))}
                            </div>
                            {vouchers.filter(v => !isVoucherClaimed(v.id)).length === 0 && (
                                <div className="text-center py-12">
                                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Bạn đã lấy hết mã giảm giá</p>
                                    <Link href="/vouchers/wallet">
                                        <Button variant="link" className="mt-2">
                                            Xem ví của bạn →
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="all">
                            <div className="grid gap-4 md:grid-cols-2">
                                {vouchers.map((voucher) => (
                                    <VoucherCard
                                        key={voucher.id}
                                        voucher={voucher}
                                        userRank={userRank}
                                        isClaimed={isVoucherClaimed(voucher.id)}
                                        onClaimed={handleRefresh}
                                    />
                                ))}
                            </div>
                            {vouchers.length === 0 && (
                                <div className="text-center py-12">
                                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Chưa có mã giảm giá nào</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
