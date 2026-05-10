"use client";

import Link from "next/link";
import { ShoppingBag, Laptop, Smartphone, Sparkles, Zap, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts, getAllBrands } from "@/lib/api/product.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductCardSkeleton";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { CategoryIcons } from "@/components/products/CategoryIcons";
import { BrandRow } from "@/components/products/BrandRow";
import { CategoryQuickLinks } from "@/components/products/CategoryQuickLinks";

function FeaturedProducts() {
    const { data, isLoading } = useQuery({
        queryKey: ["featured-products"],
        queryFn: () => getAllProducts({ page: 1, limit: 10 }),
    });

    // Fetch brands for mapping
    const { data: brandsData } = useQuery({
        queryKey: ["brands"],
        queryFn: () => getAllBrands({ page: 1, limit: 100 }),
        staleTime: 5 * 60 * 1000, // 5 minutes - brands rarely change
    });

    // Map brands to products
    const productsWithBrands = useMemo(() => {
        if (!data?.result || !brandsData?.result) return [];
        const brandMap = new Map(brandsData.result.map(b => [b.id, b]));
        return data.result.map(p => ({
            ...p,
            brand: brandMap.get(p.brandId),
        }));
    }, [data, brandsData]);

    if (isLoading) {
        return <ProductGridSkeleton count={10} />;
    }

    if (!data || data.result.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                    },
                },
            }}
        >
            <ProductGrid products={productsWithBrands as any} />
        </motion.div>
    );
}

export default function HomePage() {
    // Auth initialization moved to Header component for deduplication

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Section with Animated Gradient Orbs */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 py-20 md:py-32">
                {/* Animated gradient orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{ animationDelay: '2s' }} />
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{ animationDelay: '4s' }} />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-6"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="inline-block"
                            >
                                <Sparkles className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
                            </motion.div>

                            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                                <TypeAnimation
                                    sequence={[
                                        'Laptop Chính Hãng',
                                        2000,
                                        'Giá Tốt Nhất Thị Trường',
                                        2000,
                                        'Ưu Đãi Khủng Mỗi Ngày',
                                        2000,
                                    ]}
                                    wrapper="span"
                                    speed={50}
                                    repeat={Infinity}
                                />
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                        >
                            Khám phá laptop và điện thoại di động mới nhất với{" "}
                            <span className="font-bold text-yellow-300">giá tốt nhất</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full text-lg font-bold hover:shadow-2xl transition-all duration-300 shadow-lg"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    Mua sắm ngay
                                </Link>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 border-2 border-white/30"
                                >
                                    <TrendingUp className="h-5 w-5" />
                                    Xem ưu đãi
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                        >
                            {[
                                { label: 'Sản phẩm', value: '1000+' },
                                { label: 'Khách hàng', value: '50K+' },
                                { label: 'Đánh giá 5⭐', value: '99%' },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-white/80">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Categories with Glassmorphism */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Mua sắm theo danh mục
                        </h2>
                        <p className="text-gray-600 text-lg">Chọn danh mục phù hợp với nhu cầu của bạn</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                        >
                            <Link
                                href="/products?categoryId=33"
                                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-200/50 hover:border-blue-400/50 transition-all duration-300 block h-full shadow-lg hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <motion.div
                                        whileHover={{ rotate: 360, scale: 1.2 }}
                                        transition={{ duration: 0.6 }}
                                        className="mb-4 p-4 bg-blue-500/20 rounded-2xl"
                                    >
                                        <Laptop className="h-16 w-16 text-blue-600" />
                                    </motion.div>

                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">Laptop</h3>
                                    <p className="text-gray-600 mb-4">
                                        Laptop hiệu năng cao cho công việc và giải trí
                                    </p>

                                    <div className="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                        Khám phá ngay
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            →
                                        </motion.div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                        >
                            <Link
                                href="/products?categoryId=31"
                                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-200/50 hover:border-green-400/50 transition-all duration-300 block h-full shadow-lg hover:shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <motion.div
                                        whileHover={{ rotate: 360, scale: 1.2 }}
                                        transition={{ duration: 0.6 }}
                                        className="mb-4 p-4 bg-green-500/20 rounded-2xl"
                                    >
                                        <Smartphone className="h-16 w-16 text-green-600" />
                                    </motion.div>

                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">Điện thoại</h3>
                                    <p className="text-gray-600 mb-4">
                                        Smartphone mới nhất với công nghệ tiên tiến
                                    </p>

                                    <div className="inline-flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                                        Khám phá ngay
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            →
                                        </motion.div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Brands Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Thương hiệu nổi bật
                        </h2>
                        <p className="text-gray-600 text-lg">Các thương hiệu hàng đầu thế giới</p>
                    </motion.div>
                    <BrandRow></BrandRow>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Sản phẩm nổi bật
                            </h2>
                            <p className="text-gray-600">Những sản phẩm được yêu thích nhất</p>
                        </div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/products"
                                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                            >
                                Xem tất cả
                                <Zap className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    <FeaturedProducts />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-sm text-gray-600">
                        <p>&copy; 2024 TechStore. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
