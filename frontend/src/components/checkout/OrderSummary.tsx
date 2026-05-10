"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, ShoppingBag, Tag, Ticket } from "lucide-react";
import type { CartItem } from "@/types";
import type { Voucher } from "@/types/voucher";
import { CheckoutItemCard } from "./CheckoutItemCard";

interface OrderSummaryProps {
    selectedItems: CartItem[];
    selectedVoucher?: Voucher | null;
    voucherDiscount?: number;
}

export function OrderSummary({
    selectedItems,
    selectedVoucher,
    voucherDiscount = 0
}: OrderSummaryProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const shippingFee = 30000;
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0);
    const total = subtotal + shippingFee - voucherDiscount;

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm sticky top-24">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Đơn hàng của bạn
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {selectedItems.length} sản phẩm
                </p>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-1 max-h-80 overflow-y-auto">
                {selectedItems.map((item) => (
                    <CheckoutItemCard key={item.id} item={item} compact />
                ))}
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Phí vận chuyển</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatPrice(shippingFee)}</span>
                </div>

                {/* Voucher Discount */}
                {selectedVoucher && voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm items-center">
                        <div className="flex items-center gap-1.5">
                            <Ticket className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Mã giảm giá</span>
                        </div>
                        <span className="font-semibold text-green-600">-{formatPrice(voucherDiscount)}</span>
                    </div>
                )}

                <Separator />

                <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">(Đã bao gồm VAT)</p>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-50 border-t border-blue-200">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                    <ShoppingBag className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                        Đơn hàng sẽ được xác nhận sau khi bạn hoàn tất thanh toán
                    </span>
                </p>
            </div>
        </div>
    );
}
