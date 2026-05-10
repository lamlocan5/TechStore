"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface AnimatedPriceProps {
    currentPrice: number;
    originalPrice?: number;
    discount?: number;
    savings?: number;
    className?: string;
}

export function AnimatedPrice({
    currentPrice,
    originalPrice,
    discount,
    savings,
    className = "",
}: AnimatedPriceProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const hasDiscount = Number(discount) > 0;
    const hasSavings = Number(savings) > 0;

    return (
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-2 border border-gray-200 ${className}`}>
            <div className="flex items-baseline gap-3 flex-wrap">
                {/* Current Price - No animation */}
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent"
                >
                    {formatPrice(currentPrice)}
                </motion.span>

                {/* Original Price with Strikethrough - Only if has discount */}
                {hasDiscount && originalPrice && originalPrice > currentPrice && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="text-lg text-gray-400 line-through"
                    >
                        {formatPrice(originalPrice)}
                    </motion.span>
                )}

                {/* Discount Badge - Only if has discount */}
                {hasDiscount && (
                    <motion.div
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: -12 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, duration: 0.3 }}
                    >
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                            Giảm {discount}%
                        </Badge>
                    </motion.div>
                )}
            </div>

            {/* Savings Amount - Only if has savings */}
            {hasSavings && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="flex items-center gap-2"
                >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent" />
                    <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                        <span>💰</span>
                        Tiết kiệm: {formatPrice(Number(savings))}
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent" />
                </motion.div>
            )}
        </div>
    );
}
