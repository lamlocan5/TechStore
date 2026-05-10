"use client";

import { motion } from "framer-motion";

export function ProductCardSkeleton() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[480px] flex flex-col">
            {/* Image Skeleton with Shimmer */}
            <div className="relative aspect-square bg-gray-200 overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    animate={{
                        x: ['-100%', '100%'],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Content Skeleton */}
            <div className="p-4 space-y-3 flex-grow">
                {/* Brand */}
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Specs */}
                <div className="space-y-2 pt-2">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-4/6 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Price */}
                <div className="pt-2 border-t space-y-2">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Button */}
                <div className="h-9 w-full bg-gray-200 rounded animate-pulse" />
            </div>
        </div>
    );
}

interface ProductGridSkeletonProps {
    count?: number;
}

export function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <ProductCardSkeleton />
                </motion.div>
            ))}
        </div>
    );
}
