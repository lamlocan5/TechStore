"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
    products: Product[];
    currentProductId: string;
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
    const [currentPage, setCurrentPage] = useState(0);

    // Filter out current product and limit to related products
    const relatedProducts = products.filter(p => String(p.id) !== currentProductId);

    const productsPerPage = 5;
    const totalPages = Math.ceil(relatedProducts.length / productsPerPage);

    const currentProducts = relatedProducts.slice(
        currentPage * productsPerPage,
        (currentPage + 1) * productsPerPage
    );

    const handlePrevious = () => {
        setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const calculateDiscount = (original: number, sale: number) => {
        if (sale >= original) return 0;
        return Math.round(((original - sale) / original) * 100);
    };

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Sản phẩm liên quan</h2>

            <div className="relative">
                {/* Navigation Buttons */}
                {totalPages > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                            aria-label="Previous products"
                        >
                            <ChevronLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                            aria-label="Next products"
                        >
                            <ChevronRight className="h-6 w-6 text-gray-600" />
                        </button>
                    </>
                )}

                {/* Products Grid */}
                <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-5 gap-4"
                >
                    {currentProducts.map((product) => {
                        const discount = calculateDiscount(product.priceList, product.priceSale);
                        const hasDiscount = discount > 0;

                        return (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}-${product.id}`}
                                className="group"
                            >
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    {/* Product Image */}
                                    <div className="relative aspect-square bg-gray-100 p-4">
                                        {hasDiscount && (
                                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                -{discount}%
                                            </div>
                                        )}
                                        <Image
                                            src={product.avatar || product.firstImage || "/placeholder-product.png"}
                                            alt={product.name}
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3 space-y-2">
                                        {/* Product Name */}
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                                            {product.name}
                                        </h3>

                                        {/* Price */}
                                        <div className="space-y-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-red-600">
                                                    {formatPrice(product.priceSale)}
                                                </span>
                                            </div>
                                            {hasDiscount && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {formatPrice(product.priceList)}
                                                    </span>
                                                    <span className="text-xs text-red-600 font-medium">
                                                        -{discount}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Brand */}
                                        {product.brand && (
                                            <div className="text-xs text-gray-500">
                                                {product.brand.name}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </motion.div>

                {/* Page Indicators */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    currentPage === index
                                        ? "bg-primary w-6"
                                        : "bg-gray-300 hover:bg-gray-400"
                                )}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
