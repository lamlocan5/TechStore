"use client";

import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Order } from "@/types";

interface OrderTimelineProps {
    orders: Order[];
}

const statusConfig = {
    PENDING: {
        label: "Chờ xác nhận",
        icon: Clock,
        color: "text-slate-500",
        bgColor: "bg-slate-100",
        borderColor: "border-slate-300",
        dotColor: "bg-slate-400",
    },
    PROCESSING: {
        label: "Đang xử lý",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        dotColor: "bg-blue-500",
    },
    SHIPPING: {
        label: "Đang vận chuyển",
        icon: Truck,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-300",
        dotColor: "bg-violet-500",
    },
    DELIVERED: {
        label: "Đã giao hàng",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        dotColor: "bg-green-500",
    },
    CANCELLED: {
        label: "Đã hủy",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        dotColor: "bg-red-400",
    },
};

export function OrderTimeline({ orders }: OrderTimelineProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const getRelativeTime = (date: string) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    };

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Chưa có đơn hàng nào</p>
                <p className="text-gray-400 text-sm mt-2">Đơn hàng của bạn sẽ hiển thị ở đây</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order, index) => {
                const config = statusConfig[order.status as keyof typeof statusConfig];
                const Icon = config.icon;

                return (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                    >
                        {/* Timeline Line */}
                        {index < orders.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 -mb-4" />
                        )}

                        {/* Order Card */}
                        <div className="flex gap-4">
                            {/* Status Dot */}
                            <div className="relative flex-shrink-0">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                                    className={`w-12 h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}
                                >
                                    <Icon className={`h-6 w-6 ${config.color}`} />
                                </motion.div>
                            </div>

                            {/* Order Details */}
                            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{order.id}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {getRelativeTime(order.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="space-y-2 mb-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-700">
                                                {item.productName} x{item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="text-sm text-gray-600">
                                        {order.items.length} sản phẩm
                                    </span>
                                    <span className="text-lg font-bold text-red-600">
                                        {formatPrice(order.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
