"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store/order.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    FileText,
    Loader2,
    XCircle,
    CheckCircle2,
    Clock,
    Truck,
    Home,
    ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import type { OrderStatus } from "@/types/order";
import { OrderStatusLabels, PaymentStatusLabels, PaymentMethodLabels } from "@/types/order";
import { AddressDisplay } from "@/components/orders/AddressDisplay";
import { OrderItemCard } from "@/components/orders/OrderItemCard";

const statusConfig: Record<OrderStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
}> = {
    PENDING: {
        label: OrderStatusLabels.PENDING,
        color: "text-yellow-800",
        bgColor: "bg-yellow-100",
        icon: <Clock className="h-4 w-4" />
    },
    PAID: {
        label: OrderStatusLabels.PAID,
        color: "text-blue-800",
        bgColor: "bg-blue-100",
        icon: <CheckCircle2 className="h-4 w-4" />
    },
    SHIPPING: {
        label: OrderStatusLabels.SHIPPING,
        color: "text-purple-800",
        bgColor: "bg-purple-100",
        icon: <Truck className="h-4 w-4" />
    },
    COMPLETED: {
        label: OrderStatusLabels.COMPLETED,
        color: "text-green-800",
        bgColor: "bg-green-100",
        icon: <CheckCircle2 className="h-4 w-4" />
    },
    CANCELLED: {
        label: OrderStatusLabels.CANCELLED,
        color: "text-red-800",
        bgColor: "bg-red-100",
        icon: <XCircle className="h-4 w-4" />
    },
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { currentOrder, fetchOrderById, cancelOrder, isLoading } = useOrderStore();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const orderId = params.id as string;

    useEffect(() => {
        if (orderId) {
            fetchOrderById(Number(orderId));
        }
    }, [orderId, fetchOrderById]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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

    const handleCancelOrder = async () => {
        try {
            setIsCancelling(true);
            await cancelOrder(Number(orderId));
            setShowCancelDialog(false);
            await fetchOrderById(Number(orderId));
        } catch (error) {
            console.error("Cancel order error:", error);
        } finally {
            setIsCancelling(false);
        }
    };

    const canCancelOrder = currentOrder && (
        currentOrder.status === "PENDING" ||
        currentOrder.status === "PAID"
    );

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
                    <Button onClick={() => router.push("/orders")}>Quay lại danh sách</Button>
                </div>
            </div>
        );
    }

    const status = statusConfig[currentOrder.status];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 py-6">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/orders")}
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </Button>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-gray-200 shadow-lg p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">Đơn hàng #{currentOrder.id}</h1>
                                <p className="text-sm text-gray-600">{formatDate(currentOrder.createdAt)}</p>
                            </div>
                            <Badge className={`${status.bgColor} ${status.color} border-0 flex items-center gap-1.5`}>
                                {status.icon}
                                {status.label}
                            </Badge>
                        </div>
                    </div>
                </motion.div>

                {/* Order Details - Consolidated */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5 mb-6"
                >
                    {/* Shipping Address */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-bold text-gray-900">Địa chỉ giao hàng</h3>
                        </div>
                        <div className="pl-6">
                            <AddressDisplay addressId={currentOrder.addressId} />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-bold text-gray-900">Phương thức thanh toán</h3>
                        </div>
                        <p className="text-sm text-gray-700 pl-6">
                            {PaymentMethodLabels[currentOrder.paymentMethod]}
                        </p>
                        <p className="text-sm text-gray-600 pl-6 mt-1">
                            Trạng thái: <span className="font-medium">{PaymentStatusLabels[currentOrder.paymentStatus]}</span>
                        </p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold text-gray-900">Sản phẩm</h3>
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

                    {/* Order Note */}
                    {currentOrder.note && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold text-gray-900">Ghi chú</h3>
                            </div>
                            <p className="text-sm text-gray-700 pl-6">{currentOrder.note}</p>
                        </div>
                    )}

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

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="flex-1 gap-2 border-2"
                    >
                        <Home className="h-4 w-4" />
                        Về trang chủ
                    </Button>
                    <Button
                        onClick={() => router.push("/products")}
                        className="flex-1 gap-2"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                    </Button>
                    {canCancelOrder && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowCancelDialog(true)}
                            className="sm:w-auto gap-2"
                        >
                            <XCircle className="h-4 w-4" />
                            Hủy đơn
                        </Button>
                    )}
                </motion.div>

                {/* Cancel Confirmation Dialog */}
                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn hủy đơn hàng #{currentOrder.id}?
                                Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isCancelling}>Không</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang hủy...
                                    </>
                                ) : (
                                    "Xác nhận hủy"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
