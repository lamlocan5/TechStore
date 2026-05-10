"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Package, Clock, Cpu, HardDrive, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types";

interface ProductVariantSelectorProps {
    variants: ProductVariant[];
    selectedVariantId?: number;
    onVariantChange: (variant: ProductVariant) => void;
}

export function ProductVariantSelector({
    variants,
    selectedVariantId,
    onVariantChange,
}: ProductVariantSelectorProps) {
    // Auto-select first variant if none selected
    useEffect(() => {
        if (!selectedVariantId && variants.length > 0) {
            onVariantChange(variants[0]);
        }
    }, [variants, selectedVariantId, onVariantChange]);

    // Format storage for display
    const formatStorage = (gb: number): string => {
        if (gb >= 1000) {
            return `${gb / 1000}TB`;
        }
        return `${gb}GB`;
    };

    // Format price
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    if (variants.length === 0) {
        return null;
    }

    // If only one variant, don't show selector
    if (variants.length === 1) {
        const variant = variants[0];
        return (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>
                        {variant.stock > 0
                            ? `Còn ${variant.stock} sản phẩm`
                            : "Hỗ trợ đặt trước"}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Chọn phiên bản</h3>
            <div className="grid grid-cols-1 gap-3">
                {variants.map((variant) => {
                    const isSelected = selectedVariantId === variant.id;
                    const isOutOfStock = variant.stock === 0;

                    return (
                        <motion.button
                            key={variant.id}
                            onClick={() => onVariantChange(variant)}
                            className={cn(
                                "relative w-full p-4 rounded-xl border-2 text-left transition-all",
                                isSelected
                                    ? isOutOfStock
                                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                                        : "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                            )}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {/* Selected Check Mark */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "absolute top-3 right-3 rounded-full p-1",
                                        isOutOfStock ? "bg-violet-500" : "bg-primary"
                                    )}
                                >
                                    <Check className="h-3 w-3 text-white" />
                                </motion.div>
                            )}

                            {/* Variant Info */}
                            <div className="space-y-2">
                                {/* Specs Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Color Badge */}
                                    {variant.color && (
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                            isOutOfStock ? "bg-gray-100 text-gray-500" : "bg-gray-100 text-gray-700"
                                        )}>
                                            <Palette className="h-3 w-3" />
                                            {variant.color}
                                        </div>
                                    )}

                                    {/* RAM Badge */}
                                    {variant.ramGb && (
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                            isOutOfStock ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-700"
                                        )}>
                                            <Cpu className="h-3 w-3" />
                                            {variant.ramGb}GB RAM
                                        </div>
                                    )}

                                    {/* Storage Badge */}
                                    {variant.storageGb && (
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                            isOutOfStock ? "bg-gray-100 text-gray-500" : "bg-orange-50 text-orange-700"
                                        )}>
                                            <HardDrive className="h-3 w-3" />
                                            {formatStorage(variant.storageGb)} SSD
                                        </div>
                                    )}
                                </div>

                                {/* Price & Stock Row */}
                                <div className="flex items-center justify-between pt-1">
                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            "text-base font-bold",
                                            isSelected
                                                ? isOutOfStock ? "text-violet-600" : "text-primary"
                                                : "text-gray-900"
                                        )}>
                                            {formatPrice(variant.priceSale)}
                                        </span>
                                        {variant.priceSale < variant.priceList && (
                                            <span className="text-xs text-gray-400 line-through">
                                                {formatPrice(variant.priceList)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock Info */}
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs",
                                        variant.stock > 10
                                            ? "text-green-600"
                                            : variant.stock > 0
                                                ? "text-yellow-600"
                                                : "text-violet-600"
                                    )}>
                                        {variant.stock > 0 ? (
                                            <>
                                                <Package className="h-3 w-3" />
                                                <span>
                                                    {variant.stock > 10
                                                        ? "Còn hàng"
                                                        : `Còn ${variant.stock}`}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-3 w-3" />
                                                <span>Đặt trước</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
