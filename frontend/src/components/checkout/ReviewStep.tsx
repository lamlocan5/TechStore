"use client";

import { useAddressStore } from "@/lib/store/address.store";
import { Separator } from "@/components/ui/separator";
import { MapPin, CreditCard, Package, FileText, AlertCircle, Phone, User, Home, CheckCircle2, TrendingUp, Ticket } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import type { PaymentMethod } from "@/types/order";
import type { CartItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckoutItemCard } from "./CheckoutItemCard";
import type { Voucher } from "@/types/voucher";

interface ReviewStepProps {
    selectedAddressId: number | null;
    selectedPaymentMethod: PaymentMethod | null;
    orderNote: string;
    onNoteChange: (note: string) => void;
    termsAccepted: boolean;
    onTermsChange: (accepted: boolean) => void;
    selectedItems: CartItem[];
    selectedVoucher?: Voucher | null;
    voucherDiscount?: number;
}

export function ReviewStep({
    selectedAddressId,
    selectedPaymentMethod,
    orderNote,
    onNoteChange,
    termsAccepted,
    onTermsChange,
    selectedItems,
    selectedVoucher,
    voucherDiscount = 0,
}: ReviewStepProps) {
    const { addresses } = useAddressStore();

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const formatAddress = (address: typeof selectedAddress) => {
        if (!address) return "";
        return [
            address.addressLine,
            address.ward,
            address.district,
            address.province
        ].filter(Boolean).join(", ");
    };

    const getPaymentMethodName = (method: PaymentMethod | null) => {
        switch (method) {
            case "COD":
                return "Thanh toán khi nhận hàng (COD)";
            case "VNPAY":
                return "Thanh toán qua VNPay";
            default:
                return "Chưa chọn";
        }
    };

    const shippingFee = 30000;
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0);
    const total = subtotal + shippingFee - voucherDiscount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-gray-200 shadow-lg p-5"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Xác nhận đơn hàng</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Kiểm tra kỹ thông tin trước khi đặt hàng</p>
                    </div>
                </div>
            </motion.div>

            {/* Consolidated Order Information */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5"
            >
                {/* Shipping Address Section */}
                <div className="mb-5 pb-5 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Địa chỉ giao hàng
                    </h3>
                    {selectedAddress ? (
                        <div className="space-y-1.5 text-sm pl-6">
                            <p className="font-semibold text-gray-900">{selectedAddress.receiverName}</p>
                            <p className="text-gray-600">{selectedAddress.phone}</p>
                            <p className="text-gray-700">{formatAddress(selectedAddress)}</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 pl-6">
                            <AlertCircle className="h-4 w-4" />
                            <p className="text-sm font-medium">Chưa chọn địa chỉ giao hàng</p>
                        </div>
                    )}
                </div>

                {/* Payment Method Section */}
                <div className="mb-5 pb-5 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Phương thức thanh toán
                    </h3>
                    <p className="text-sm text-gray-700 pl-6 font-medium">{getPaymentMethodName(selectedPaymentMethod)}</p>
                </div>

                {/* Order Items Section */}
                <div className="mb-5 pb-5 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Sản phẩm đã chọn
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                            {selectedItems.length} sản phẩm
                        </Badge>
                    </div>

                    <div className="pl-2">
                        {selectedItems.map((item) => (
                            <CheckoutItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-2 text-sm mb-5">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tạm tính</span>
                        <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Phí vận chuyển</span>
                        <span className="font-semibold text-gray-900">{formatPrice(shippingFee)}</span>
                    </div>
                    {selectedVoucher && voucherDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                                <Ticket className="h-4 w-4" />
                                Mã giảm giá ({selectedVoucher.code})
                            </span>
                            <span className="font-semibold">-{formatPrice(voucherDiscount)}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">(Đã bao gồm VAT)</p>
                        </div>
                    </div>
                </div>

                {/* Order Note */}
                <div className="mb-5">
                    <Label htmlFor="orderNote" className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Ghi chú đơn hàng (Tùy chọn)
                    </Label>
                    <Textarea
                        id="orderNote"
                        value={orderNote}
                        onChange={(e) => onNoteChange(e.target.value)}
                        placeholder="Ví dụ: Giao hàng trước 5 giờ chiều, gọi điện trước khi giao..."
                        className="min-h-[80px] resize-none border-2 focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                </div>

                {/* Terms and Conditions */}
                <div className={cn(
                    "rounded-xl border-2 p-4 transition-all",
                    termsAccepted
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                )}>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => onTermsChange(checked as boolean)}
                            className="mt-0.5 h-5 w-5"
                        />
                        <div className="flex-1">
                            <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-relaxed cursor-pointer text-gray-900"
                            >
                                Tôi đã đọc và đồng ý với{" "}
                                <a href="/terms" className="text-primary hover:underline font-semibold">
                                    Điều khoản và điều kiện
                                </a>{" "}
                                của cửa hàng
                            </Label>
                            {termsAccepted && (
                                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Cảm ơn bạn đã đồng ý với điều khoản
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
