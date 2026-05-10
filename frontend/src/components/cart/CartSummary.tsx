"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Tag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CartSummaryProps {
    subtotal: number;
    total: number;
    itemCount: number;
    selectedItemIds?: number[];
}

export function CartSummary({ subtotal, total, itemCount, selectedItemIds = [] }: CartSummaryProps) {
    const router = useRouter();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const handleCheckout = () => {
        if (selectedItemIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán");
            return;
        }
        router.push("/checkout");
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm sticky top-24">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Tóm tắt đơn hàng
                </h3>
            </div>

            {/* Summary Details */}
            <div className="p-6 space-y-4">
                {/* Selected Items Count */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Đã chọn</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{itemCount}</span>
                </div>

                {/* Subtotal */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tạm tính</span>
                        <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phí vận chuyển</span>
                        <span className="text-sm text-gray-500">Tính sau</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">(Đã bao gồm VAT)</p>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <Button
                    onClick={handleCheckout}
                    disabled={itemCount === 0}
                    className="w-full h-12 text-base font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                    size="lg"
                >
                    <ShoppingCart className="h-5 w-5" />
                    Tiến hành thanh toán
                </Button>

                {/* Info Note */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                        💡 Phí vận chuyển sẽ được tính dựa trên địa chỉ giao hàng ở bước tiếp theo
                    </p>
                </div>
            </div>

            {/* Promotion Banner */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-green-700">
                        <span className="font-semibold">Miễn phí vận chuyển</span> cho đơn hàng từ 500.000đ
                    </p>
                </div>
            </div>
        </div>
    );
}
