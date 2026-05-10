"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store/order.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Loader2, Home, ShoppingBag, Search, Filter, TrendingUp, Clock, Truck, CheckCircle, ArrowLeft } from "lucide-react";
import type { OrderStatus } from "@/types/order";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, hasHydrated } = useAuthStore();
    const { orders, fetchOrders, fetchOrdersByStatus, isLoading, pagination, statusCounts, fetchStatusCounts } = useOrderStore();
    const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/orders");
            return;
        }
        // Only fetch status counts on mount
        // Orders will be fetched by the second useEffect
        fetchStatusCounts();
    }, [isAuthenticated, hasHydrated, fetchStatusCounts, router]);

    // Fetch orders when tab changes
    useEffect(() => {
        if (!hasHydrated || !isAuthenticated) return;

        if (activeTab === "all") {
            fetchOrders({ page: currentPage, limit: 12 });
        } else {
            fetchOrdersByStatus(activeTab, { page: currentPage, limit: 12 });
        }
    }, [activeTab, currentPage, isAuthenticated, hasHydrated, fetchOrders, fetchOrdersByStatus]);

    // Reset to page 1 when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Client-side search filtering (only for search, not for tabs)
    const filteredOrders = orders.filter(order => {
        if (searchQuery === "") return true;
        return order.id.toString().includes(searchQuery) ||
            order.items.some(item => item.productName?.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    const getOrderCount = (status: "all" | OrderStatus) => {
        // Use status counts from API for accurate totals
        if (status === "all") return statusCounts.PENDING + statusCounts.PAID + statusCounts.SHIPPING + statusCounts.COMPLETED + statusCounts.CANCELLED;
        return statusCounts[status] || 0;
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Header with Subtle Gradient */}
            <div className="bg-gradient-to-r from-primary/95 to-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Title */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Package className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>
                                <p className="text-white/90 mt-1">
                                    Quản lý và theo dõi tất cả đơn hàng của bạn
                                </p>
                            </div>
                        </div>

                        {/* Stats Cards with Subtle Gradients */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80">Tổng đơn</p>
                                        <p className="text-2xl font-bold text-white">{getOrderCount("all")}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-400/30 rounded-lg">
                                        <Clock className="h-5 w-5 text-yellow-100" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80">Chờ xác nhận</p>
                                        <p className="text-2xl font-bold text-white">{getOrderCount("PENDING")}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-400/30 rounded-lg">
                                        <Truck className="h-5 w-5 text-purple-100" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80">Đang giao</p>
                                        <p className="text-2xl font-bold text-white">{getOrderCount("SHIPPING")}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-400/30 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-100" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/80">Hoàn thành</p>
                                        <p className="text-2xl font-bold text-white">{getOrderCount("COMPLETED")}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <Button variant="outline" className="gap-2 h-11 border-gray-300 hover:border-primary hover:bg-primary/5">
                                <Filter className="h-4 w-4" />
                                Lọc
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-6"
                >
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-white shadow-sm border border-gray-200">
                            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Tất cả</span>
                                <span className="md:hidden">All</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("all")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Đang xử lý</span>
                                <span className="md:hidden">Chờ</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("PENDING")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="PAID" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Đã thanh toán</span>
                                <span className="md:hidden">Paid</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("PAID")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="SHIPPING" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Đang giao</span>
                                <span className="md:hidden">Ship</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("SHIPPING")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-green-500 data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Hoàn thành</span>
                                <span className="md:hidden">Done</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("COMPLETED")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500 data-[state=active]:text-white py-3">
                                <span className="hidden md:inline">Đã hủy</span>
                                <span className="md:hidden">Hủy</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium data-[state=active]:bg-white/20 text-gray-700 data-[state=active]:text-white">
                                    {getOrderCount("CANCELLED")}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </motion.div>

                {/* Orders List */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200"
                        >
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-gray-500">Đang tải đơn hàng...</p>
                        </motion.div>
                    ) : filteredOrders.length > 0 ? (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <OrderTimeline orders={filteredOrders} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                                <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchQuery ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng"}
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                {searchQuery
                                    ? `Không tìm thấy đơn hàng nào phù hợp với "${searchQuery}"`
                                    : activeTab === "all"
                                        ? "Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!"
                                        : `Không có đơn hàng nào ở trạng thái này`
                                }
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => router.push("/products")} size="lg" className="gap-2">
                                    <ShoppingBag className="h-5 w-5" />
                                    Bắt đầu mua sắm
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                    >
                        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
                            <div className="flex items-center justify-between gap-4">
                                {/* Previous Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Trước</span>
                                </Button>

                                {/* Page Info */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Trang</span>
                                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                        <span className="text-sm font-bold text-primary">{pagination.page}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">/ {pagination.totalPages}</span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        ({pagination.total} đơn hàng)
                                    </span>
                                </div>

                                {/* Next Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="gap-2"
                                >
                                    <span className="hidden sm:inline">Sau</span>
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Navigation Buttons */}
                {orders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                            className="gap-2 h-11 px-6 border-2 hover:border-primary hover:bg-primary/5"
                        >
                            <Home className="h-5 w-5" />
                            Về trang chủ
                        </Button>
                        <Button
                            onClick={() => router.push("/products")}
                            className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            Tiếp tục mua sắm
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
