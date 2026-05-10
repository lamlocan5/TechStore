"use client";

import { Laptop, Smartphone, Cpu, Briefcase, Layers, Palette, Zap, Monitor } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
    {
        id: "laptop-ai",
        name: "Laptop AI",
        icon: Cpu,
        color: "from-purple-500 to-pink-500",
        href: "/products?category=laptop-ai",
    },
    {
        id: "gaming",
        name: "Gaming",
        icon: Zap,
        color: "from-red-500 to-orange-500",
        href: "/products?category=gaming",
    },
    {
        id: "van-phong",
        name: "Văn Phòng",
        icon: Briefcase,
        color: "from-blue-500 to-cyan-500",
        href: "/products?category=van-phong",
    },
    {
        id: "sinh-vien",
        name: "Sinh viên",
        icon: Layers,
        color: "from-green-500 to-emerald-500",
        href: "/products?category=sinh-vien",
    },
    {
        id: "2-in-1",
        name: "Cảm ứng 2 in 1",
        icon: Smartphone,
        color: "from-purple-500 to-indigo-500",
        href: "/products?category=2-in-1",
    },
    {
        id: "do-hoa",
        name: "Đồ họa",
        icon: Palette,
        color: "from-pink-500 to-rose-500",
        href: "/products?category=do-hoa",
    },
    {
        id: "mong-nhe",
        name: "Mỏng nhẹ",
        icon: Laptop,
        color: "from-yellow-500 to-amber-500",
        href: "/products?category=mong-nhe",
    },
    {
        id: "workstation",
        name: "Workstation",
        icon: Monitor,
        color: "from-gray-600 to-gray-800",
        href: "/products?category=workstation",
    },
];

export function CategoryIcons() {
    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-bold mb-3">Chọn mua laptop theo nhu cầu</h3>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.03,
                        },
                    },
                }}
                className="grid grid-cols-4 md:grid-cols-8 gap-2"
            >
                {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <motion.div
                            key={category.id}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ y: -4, scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link
                                href={category.href}
                                className="flex flex-col items-center gap-1 group w-full"
                            >
                                {/* Icon Circle - Larger and Fixed Size */}
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0`}>
                                    <Icon className="h-8 w-8 text-white" />
                                </div>

                                {/* Category Name - Fixed Height Container */}
                                <div className="h-10 flex items-center justify-center w-full">
                                    <span className="text-[10px] text-center font-medium text-gray-700 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2 px-1">
                                        {category.name}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
