"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSwatch {
    id: string;
    name: string;
    hex: string;
    available: boolean;
    stock?: number;
}

interface SizeOption {
    id: string;
    label: string;
    available: boolean;
    stock?: number;
}

interface VariantSelectorProps {
    colors?: ColorSwatch[];
    sizes?: SizeOption[];
    selectedColor?: string;
    selectedSize?: string;
    onColorChange?: (colorId: string) => void;
    onSizeChange?: (sizeId: string) => void;
}

export function VariantSelector({
    colors = [],
    sizes = [],
    selectedColor,
    selectedSize,
    onColorChange,
    onSizeChange,
}: VariantSelectorProps) {
    return (
        <div className="space-y-4">
            {/* Color Selector */}
            {colors.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Màu sắc</h3>
                        {selectedColor && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-gray-600"
                            >
                                {colors.find((c) => c.id === selectedColor)?.name}
                            </motion.span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => (
                            <motion.button
                                key={color.id}
                                onClick={() => color.available && onColorChange?.(color.id)}
                                disabled={!color.available}
                                className={cn(
                                    "relative w-12 h-12 rounded-full border-2 transition-all",
                                    selectedColor === color.id
                                        ? "border-primary ring-4 ring-primary/20 scale-110"
                                        : "border-gray-300 hover:border-gray-400",
                                    !color.available && "opacity-40 cursor-not-allowed"
                                )}
                                whileHover={color.available ? { scale: 1.1, y: -2 } : {}}
                                whileTap={color.available ? { scale: 0.95 } : {}}
                                transition={{ duration: 0.2 }}
                                title={color.name}
                            >
                                <div
                                    className="w-full h-full rounded-full shadow-md"
                                    style={{ backgroundColor: color.hex }}
                                />

                                {/* Check Mark for Selected */}
                                {selectedColor === color.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <div className="bg-white rounded-full p-1 shadow-lg">
                                            <Check className="h-4 w-4 text-primary" />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Strikethrough for Unavailable */}
                                {!color.available && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-gray-400 rotate-45" />
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Kích thước</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {sizes.map((size) => (
                            <motion.button
                                key={size.id}
                                onClick={() => size.available && onSizeChange?.(size.id)}
                                disabled={!size.available}
                                className={cn(
                                    "relative px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all",
                                    selectedSize === size.id
                                        ? "border-primary bg-primary text-white shadow-lg"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                                    !size.available && "opacity-40 cursor-not-allowed line-through"
                                )}
                                whileHover={size.available ? { scale: 1.05, y: -2 } : {}}
                                whileTap={size.available ? { scale: 0.95 } : {}}
                                transition={{ duration: 0.2 }}
                            >
                                {size.label}

                                {/* Check Icon for Selected */}
                                {selectedSize === size.id && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md"
                                    >
                                        <Check className="h-3 w-3 text-primary" />
                                    </motion.div>
                                )}

                                {/* Ripple Effect on Click */}
                                {selectedSize === size.id && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0.5 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="absolute inset-0 rounded-lg bg-primary"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
