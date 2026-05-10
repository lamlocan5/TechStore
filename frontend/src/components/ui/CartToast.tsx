"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartToastProps {
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    onClose: () => void;
}

export function CartToast({
    productName,
    productImage,
    quantity,
    price,
    onClose,
}: CartToastProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-w-md w-full"
        >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center gap-3">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="bg-white rounded-full p-1"
                >
                    <Check className="h-5 w-5 text-green-600" />
                </motion.div>
                <span className="text-white font-semibold">Đã thêm vào giỏ hàng!</span>
                <button
                    onClick={onClose}
                    className="ml-auto text-white/80 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Product Info */}
            <div className="p-4 flex gap-3">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                >
                    <Image
                        src={productImage}
                        alt={productName}
                        fill
                        className="object-contain p-2"
                        unoptimized={productImage === "/placeholder-product.png"}
                    />
                </motion.div>

                <div className="flex-1 min-w-0">
                    <motion.h4
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="font-medium text-gray-900 line-clamp-2 text-sm mb-1"
                    >
                        {productName}
                    </motion.h4>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 text-sm text-gray-600"
                    >
                        <span>Số lượng: {quantity}</span>
                        <span>•</span>
                        <span className="font-semibold text-red-600">
                            {formatPrice(price * quantity)}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-4 pb-4 flex gap-2"
            >
                <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                >
                    <Link href="/products">Tiếp tục mua sắm</Link>
                </Button>
                <Button
                    asChild
                    className="flex-1 bg-primary hover:bg-primary/90"
                >
                    <Link href="/cart">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Xem giỏ hàng
                    </Link>
                </Button>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-1 bg-gradient-to-r from-green-500 to-green-600 origin-left"
            />
        </motion.div>
    );
}
