"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store/order.store";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, MapPin, CreditCard, ShoppingBag, ArrowRight, Home, Loader2, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import { AddressDisplay } from "@/components/orders/AddressDisplay";
import { OrderItemCard } from "@/components/orders/OrderItemCard";

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const { currentOrder, fetchOrderById, isLoading } = useOrderStore();
    const orderId = params.id as string;

    useEffect(() => {
        if (orderId) {
            fetchOrderById(Number(orderId));
        }
    }, [orderId, fetchOrderById]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case "COD":
                return "Thanh toán khi nhận hàng";
            case "VNPAY":
                return "VNPay";
            case "MOMO":
                return "Ví MoMo";
            default:
                return method;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Không tìm thấy đơn hàng</p>
                    <Button onClick={() => router.push("/")}>Về trang chủ</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Success Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border-2 border-green-200 shadow-lg p-6 text-center mb-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4"
                    >
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
                    <p className="text-sm text-gray-600 mb-4">
                        Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                        <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                        <span className="text-lg font-bold text-primary">#{currentOrder.id}</span>
                    </div>
                </motion.div>

                {/* Order Details - Consolidated */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5 mb-6"
                >
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Chi tiết đơn hàng
                    </h2>

                    {/* Shipping Address */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-gray-900">Địa chỉ giao hàng</span>
                        </div>
                        <div className="pl-6">
                            <AddressDisplay addressId={currentOrder.addressId} />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-gray-900">Phương thức thanh toán</span>
                        </div>
                        <p className="text-sm text-gray-700 pl-6">
                            {getPaymentMethodName(currentOrder.paymentMethod)}
                        </p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-gray-900">Sản phẩm</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {currentOrder.items.length} sản phẩm
                            </Badge>
                        </div>
                        <div className="pl-2">
                            {currentOrder.items.map((item, index) => (
                                <OrderItemCard key={index} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Price Summary */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tạm tính</span>
                            <span className="font-semibold text-gray-900">{formatPrice(currentOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Phí vận chuyển</span>
                            <span className="font-semibold text-gray-900">{formatPrice(currentOrder.shippingFee)}</span>
                        </div>
                        {currentOrder.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Giảm giá</span>
                                <span className="font-semibold">-{formatPrice(currentOrder.discount)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                            <span className="text-2xl font-bold text-primary">{formatPrice(currentOrder.total)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Estimated Delivery */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 mb-6"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Thời gian giao hàng dự kiến
                            </p>
                            <p className="text-sm text-blue-700">3-5 ngày làm việc</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <Button asChild variant="outline" className="flex-1 border-2">
                        <Link href="/">
                            <Home className="h-4 w-4 mr-2" />
                            Về trang chủ
                        </Link>
                    </Button>
                    <Button asChild className="flex-1 gap-2">
                        <Link href="/products">
                            Tiếp tục mua sắm
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
