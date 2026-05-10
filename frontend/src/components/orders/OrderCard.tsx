"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, CreditCard } from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";
import { OrderStatusLabels } from "@/types/order";
import Link from "next/link";

interface OrderCardProps {
    order: Order;
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
    PENDING: { label: OrderStatusLabels.PENDING, color: "bg-yellow-100 text-yellow-800" },
    PAID: { label: OrderStatusLabels.PAID, color: "bg-blue-100 text-blue-800" },
    SHIPPING: { label: OrderStatusLabels.SHIPPING, color: "bg-purple-100 text-purple-800" },
    COMPLETED: { label: OrderStatusLabels.COMPLETED, color: "bg-green-100 text-green-800" },
    CANCELLED: { label: OrderStatusLabels.CANCELLED, color: "bg-red-100 text-red-800" },
};

export function OrderCard({ order }: OrderCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const status = statusConfig[order.status] || statusConfig.PENDING;

    return (
        <Link href={`/ orders / ${order.id} `}>
            <Card className="p-3 hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">#{order.id}</span>
                            <Badge className={`${status.color} text - xs px - 2 py - 0`}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(order.createdAt)}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Tổng tiền</p>
                        <p className="text-base font-bold text-primary">{formatPrice(order.total)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{order.items.length} SP</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span>{order.paymentMethod === "COD" ? "COD" : "VNPay"}</span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
