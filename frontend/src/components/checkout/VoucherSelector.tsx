"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, ChevronDown, ChevronUp, Loader2, Check, X, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getMyWalletWithDetails, getVoucherById, calculateDiscount, formatVoucherDiscount, isVoucherValid } from "@/lib/api/voucher.service";
import type { UserVoucher, Voucher } from "@/types/voucher";
import Link from "next/link";

interface VoucherSelectorProps {
    subtotal: number;
    onVoucherSelect: (voucher: Voucher | null, discount: number) => void;
}

export function VoucherSelector({ subtotal, onVoucherSelect }: VoucherSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [wallet, setWallet] = useState<UserVoucher[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        if (isOpen && wallet.length === 0) {
            fetchWallet();
        }
    }, [isOpen]);

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const data = await getMyWalletWithDetails();
            // Filter to only valid vouchers
            const validVouchers = data.filter(w => !w.isUsed && w.voucher && isVoucherValid(w.voucher));
            setWallet(validVouchers);
        } catch (error) {
            console.error("Error fetching wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectVoucher = async (code: string) => {
        setSelectedCode(code);
        setManualCode("");
        setError(null);

        const walletItem = wallet.find(w => w.voucher?.code === code);
        if (walletItem?.voucher) {
            applyVoucher(walletItem.voucher);
        }
    };

    const handleManualCode = async () => {
        if (!manualCode.trim()) return;

        setApplying(true);
        setError(null);
        setSelectedCode(null);

        try {
            // Try to find in wallet first
            const walletItem = wallet.find(w => w.voucher?.code === manualCode.trim().toUpperCase());
            if (walletItem?.voucher) {
                applyVoucher(walletItem.voucher);
                return;
            }

            // If not in wallet, try to fetch by code (if API supports)
            setError("Mã không tồn tại trong ví của bạn. Vui lòng lấy mã trước.");
        } catch (error) {
            setError("Không tìm thấy mã giảm giá");
        } finally {
            setApplying(false);
        }
    };

    const applyVoucher = (voucher: Voucher) => {
        // Check min order total
        if (subtotal < voucher.minOrderTotal) {
            setError(`Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(voucher.minOrderTotal)}đ`);
            setAppliedVoucher(null);
            setDiscount(0);
            onVoucherSelect(null, 0);
            return;
        }

        const discountAmount = calculateDiscount(voucher, subtotal);
        setAppliedVoucher(voucher);
        setDiscount(discountAmount);
        setError(null);
        setApplying(false);
        onVoucherSelect(voucher, discountAmount);
    };

    const handleRemoveVoucher = () => {
        setSelectedCode(null);
        setManualCode("");
        setAppliedVoucher(null);
        setDiscount(0);
        setError(null);
        onVoucherSelect(null, 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-gray-900">Mã giảm giá</span>
                    {appliedVoucher && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                            -{formatPrice(discount)}đ
                        </Badge>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {/* Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200"
                    >
                        <div className="p-4">
                            {/* Applied Voucher */}
                            {appliedVoucher && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-green-800">{appliedVoucher.name}</p>
                                            <p className="text-sm text-green-600">
                                                {formatVoucherDiscount(appliedVoucher)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveVoucher}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Wallet Vouchers */}
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : wallet.length > 0 ? (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <Wallet className="h-4 w-4" />
                                        Từ ví của bạn
                                    </p>
                                    <RadioGroup
                                        value={selectedCode || ""}
                                        onValueChange={handleSelectVoucher}
                                        className="space-y-2"
                                    >
                                        {wallet.map((item) => {
                                            const voucher = item.voucher!;
                                            const meetsMinimum = subtotal >= voucher.minOrderTotal;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                                                        ${meetsMinimum
                                                            ? "border-gray-200 hover:border-primary/50"
                                                            : "border-gray-100 opacity-50"
                                                        }
                                                        ${selectedCode === voucher.code ? "border-primary bg-primary/5" : ""}
                                                    `}
                                                >
                                                    <RadioGroupItem
                                                        value={voucher.code}
                                                        id={`voucher-${item.id}`}
                                                        disabled={!meetsMinimum}
                                                    />
                                                    <Label
                                                        htmlFor={`voucher-${item.id}`}
                                                        className={`flex-1 cursor-pointer ${!meetsMinimum ? "cursor-not-allowed" : ""}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm">
                                                                    {voucher.code}
                                                                </p>
                                                                <p className="text-xs text-primary">
                                                                    {formatVoucherDiscount(voucher)}
                                                                </p>
                                                            </div>
                                                            {!meetsMinimum && (
                                                                <span className="text-xs text-gray-400">
                                                                    Đơn từ {formatPrice(voucher.minOrderTotal)}đ
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                </div>
                            ) : (
                                <div className="text-center py-4 mb-4">
                                    <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Ví trống</p>
                                    <Link href="/vouchers" className="text-primary text-sm hover:underline inline-flex items-center gap-1 mt-1">
                                        Lấy mã ngay <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            )}

                            {/* Manual Input */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Hoặc nhập mã
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="Nhập mã giảm giá"
                                        className="flex-1 uppercase"
                                    />
                                    <Button
                                        onClick={handleManualCode}
                                        disabled={!manualCode.trim() || applying}
                                    >
                                        {applying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Áp dụng"
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-sm text-red-500 mt-2">{error}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
