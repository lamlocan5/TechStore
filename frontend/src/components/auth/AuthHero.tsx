"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Sparkles, Shield, Zap } from "lucide-react";

interface AuthHeroProps {
    type: 'login' | 'register';
}

export function AuthHero({ type }: AuthHeroProps) {
    const features = type === 'login' ? [
        { icon: ShoppingBag, text: "Hàng ngàn sản phẩm chính hãng" },
        { icon: Shield, text: "Bảo hành toàn quốc" },
        { icon: Zap, text: "Giao hàng nhanh 2h" },
    ] : [
        { icon: Sparkles, text: "Ưu đãi độc quyền cho thành viên mới" },
        { icon: Shield, text: "Bảo mật thông tin tuyệt đối" },
        { icon: Zap, text: "Đăng ký nhanh chóng, dễ dàng" },
    ];

    return (
        <div className="relative h-full flex flex-col justify-center p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 overflow-hidden">
            {/* Animated Background Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl"
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl shadow-lg">
                        <ShoppingBag className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            TechStore
                        </h1>
                        <p className="text-sm text-gray-600">Công nghệ cho mọi người</p>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl font-bold text-gray-900 mb-4"
                >
                    {type === 'login' ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình của bạn'}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-lg text-gray-600 mb-12"
                >
                    {type === 'login'
                        ? 'Đăng nhập để tiếp tục mua sắm và trải nghiệm những ưu đãi tuyệt vời'
                        : 'Tạo tài khoản để khám phá hàng ngàn sản phẩm công nghệ chính hãng'}
                </motion.p>

                {/* Features */}
                <div className="space-y-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                                className="flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                            >
                                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-2 rounded-lg">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <span className="text-gray-700 font-medium">{feature.text}</span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Decorative Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 grid grid-cols-3 gap-4"
                >
                    <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            10K+
                        </div>
                        <div className="text-sm text-gray-600">Sản phẩm</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            50K+
                        </div>
                        <div className="text-sm text-gray-600">Khách hàng</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            99%
                        </div>
                        <div className="text-sm text-gray-600">Hài lòng</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
