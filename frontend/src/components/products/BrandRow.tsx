"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "@/lib/api/product.service";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function BrandRow() {
    const { data, isLoading } = useQuery({
        queryKey: ["brands"],
        queryFn: () => getAllBrands({ page: 1, limit: 20 }),
        staleTime: 5 * 60 * 1000, // 5 minutes - brands rarely change
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-bold mb-3">Chọn laptop theo thương hiệu</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {Array.from({ length: 16 }).map((_, index) => (
                        <div key={index} className="aspect-[3/2] bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.result.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-bold mb-3">Chọn sản phẩm theo thương hiệu</h3>

            {/* 2 rows x 8 columns grid - limit to 16 brands */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.03,
                        },
                    },
                }}
                className="grid grid-cols-4 md:grid-cols-8 gap-3"
            >
                {data.result.slice(0, 16).map((brand) => (
                    <motion.div
                        key={brand.id}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        whileHover={{ y: -4, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link
                            href={`/brands/${brand.id}`}
                            className="block aspect-[3/2] bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-md transition-all duration-200 p-2"
                        >
                            {brand.logo ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={brand.logo}
                                        alt={brand.name}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-xs font-semibold text-gray-600 text-center line-clamp-2">
                                        {brand.name}
                                    </span>
                                </div>
                            )}
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
