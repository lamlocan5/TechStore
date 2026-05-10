"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShoppingBag, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { useCartStore } from "@/lib/store/cart.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";

export default function CartPage() {
    const router = useRouter();
    const { cart, fetchCart, isLoading, selectedItemIds, toggleItemSelection, selectAllItems, clearSelection } = useCartStore();
    const { isAuthenticated, hasHydrated } = useAuthStore();

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/cart");
            return;
        }
        fetchCart();
    }, [isAuthenticated, hasHydrated, fetchCart, router]);

    const items = cart?.items || [];
    const totalItems = cart?.totalItems || 0;
    const subtotal = cart?.totalAmount || 0;

    // Calculate subtotal for selected items only
    const selectedSubtotal = items
        .filter(item => selectedItemIds.includes(item.id))
        .reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0);

    const selectedCount = selectedItemIds.length;
    const allSelected = items.length > 0 && selectedItemIds.length === items.length;

    if (isLoading && !cart) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/3" />
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                                ))}
                            </div>
                            <div className="h-64 bg-gray-200 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
            <Header />

            {/* Breadcrumb */}
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">Giỏ hàng</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {items.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <>
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <ShoppingBag className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                                        <p className="text-gray-600 text-sm mt-0.5">
                                            {totalItems} sản phẩm
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Cart Grid */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Select All */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white rounded-xl border-2 border-gray-200 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={() => allSelected ? clearSelection() : selectAllItems()}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <span className="font-medium text-gray-900">
                                                Chọn tất cả ({items.length} sản phẩm)
                                            </span>
                                        </div>
                                        {selectedCount > 0 && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600">
                                                    Đã chọn: <span className="font-semibold text-primary">{selectedCount}</span>
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearSelection}
                                                    className="text-gray-600 hover:text-red-600"
                                                >
                                                    Bỏ chọn
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Items List */}
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                        <CartItem
                                            item={item}
                                            isSelected={selectedItemIds.includes(item.id)}
                                            onToggleSelect={() => toggleItemSelection(item.id)}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Summary Sidebar */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <CartSummary
                                    subtotal={selectedSubtotal}
                                    total={selectedSubtotal}
                                    itemCount={selectedCount}
                                    selectedItemIds={selectedItemIds}
                                />
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
