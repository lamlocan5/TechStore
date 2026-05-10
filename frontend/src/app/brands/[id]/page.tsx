"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBrandById, getProductsByBrand } from "@/lib/api/product.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductCardSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Header } from "@/components/layout/Header";
import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function BrandPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const brandId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "0");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Fetch brand details
    const { data: brand, isLoading: brandLoading } = useQuery({
        queryKey: ["brand", brandId],
        queryFn: () => getBrandById(brandId),
        enabled: brandId > 0,
    });

    // Fetch products by brand id
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ["products-by-brand", brandId, page, limit],
        queryFn: () => getProductsByBrand({ brandId, page, limit }),
        enabled: brandId > 0,
    });

    if (brandLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 bg-gray-200 rounded mb-8" />
                        <ProductGridSkeleton count={10} />
                    </div>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-red-600">Không tìm thấy thương hiệu</p>
                        <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
                            Quay lại danh sách sản phẩm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        <Link href="/products" className="hover:text-primary transition-colors">
                            Sản phẩm
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 font-medium">{brand.name}</span>
                    </div>
                </div>
            </div>

            {/* Brand Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-6"
                    >
                        {/* Brand Logo */}
                        {brand.logo && (
                            <div className="relative w-24 h-24 bg-white rounded-xl border-2 border-gray-200 p-4 flex-shrink-0">
                                <Image
                                    src={brand.logo}
                                    alt={brand.name}
                                    fill
                                    className="object-contain p-2"
                                    unoptimized
                                />
                            </div>
                        )}

                        {/* Brand Info */}
                        <div className="flex-grow">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                {brand.name}
                            </h1>
                            <p className="text-gray-600 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {productsData?.total || 0} sản phẩm
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Products */}
            <div className="container mx-auto px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {productsLoading ? (
                        <ProductGridSkeleton count={limit} />
                    ) : productsData && productsData.result.length > 0 ? (
                        <>
                            <ProductGrid products={productsData.result} />

                            <Pagination
                                currentPage={page}
                                totalPages={productsData.totalPages}
                                baseUrl={`/brands/${brandId}`}
                                searchParams={{ limit: limit.toString() }}
                            />
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-600 text-lg">Không có sản phẩm nào từ thương hiệu này</p>
                            <Link
                                href="/products"
                                className="inline-block mt-4 text-primary hover:underline"
                            >
                                Xem tất cả sản phẩm
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
