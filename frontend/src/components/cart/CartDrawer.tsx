"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "./CartItem";
import { EmptyCart } from "./EmptyCart";
import { useCartStore } from "@/lib/store/cart.store";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart } = useCartStore();
    const items = cart?.items || [];
    const totalItems = cart?.totalItems || 0;
    const totalAmount = cart?.totalAmount || 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">
                                Giỏ hàng ({totalItems} sản phẩm)
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {items.length === 0 ? (
                                <EmptyCart />
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <CartItem key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="border-t p-4 space-y-4">
                                {/* Total */}
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatPrice(totalAmount)}
                                    </span>
                                </div>

                                {/* Buttons */}
                                <div className="space-y-2">
                                    <Button asChild className="w-full" size="lg">
                                        <Link href="/cart" onClick={onClose}>
                                            Xem chi tiết giỏ hàng
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Link href="/products" onClick={onClose}>
                                            Tiếp tục mua sắm
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
