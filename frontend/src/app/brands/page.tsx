"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "@/lib/api/product.service";
import { Header } from "@/components/layout/Header";
import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Pagination } from "@/components/ui/Pagination";

export default function BrandsPage() {
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");

    const { data, isLoading } = useQuery({
        queryKey: ["brands", page, limit],
        queryFn: () => getAllBrands({ page, limit }),
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Breadcrumb */}
            <div className="border-b bg-white">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">Thương hiệu</span>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Tất cả thương hiệu
                        </h1>
                        <p className="text-gray-600">
                            Khám phá các thương hiệu hàng đầu
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Brands Grid */}
            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 24 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                            </div>
                        ))}
                    </div>
                ) : data && data.result.length > 0 ? (
                    <>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05,
                                    },
                                },
                            }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                        >
                            {data.result.map((brand) => (
                                <motion.div
                                    key={brand.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 },
                                    }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link
                                        href={`/brands/${brand.id}`}
                                        className="block bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all duration-300 group"
                                    >
                                        {/* Brand Logo */}
                                        <div className="relative aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
                                            {brand.logo ? (
                                                <Image
                                                    src={brand.logo}
                                                    alt={brand.name}
                                                    fill
                                                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Package className="h-12 w-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Brand Name */}
                                        <h3 className="text-center font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                            {brand.name}
                                        </h3>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            totalPages={data.totalPages}
                            baseUrl="/brands"
                            searchParams={{ limit: limit.toString() }}
                        />
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 text-lg">Không có thương hiệu nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}
