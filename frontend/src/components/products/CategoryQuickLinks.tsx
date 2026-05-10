"use client";

import Link from "next/link";
import Image from "next/image";
import {
    Laptop,
    Gamepad2,
    Briefcase,
    GraduationCap,
    Sparkles,
    Layers,
    Palette,
    Zap
} from "lucide-react";

interface CategoryLink {
    name: string;
    slug: string;
    icon: React.ReactNode;
    color: string;
}

const CATEGORY_LINKS: CategoryLink[] = [
    {
        name: "Laptop AI",
        slug: "laptop-ai",
        icon: <Sparkles className="h-8 w-8" />,
        color: "from-purple-500 to-pink-500",
    },
    {
        name: "Gaming",
        slug: "laptop-gaming",
        icon: <Gamepad2 className="h-8 w-8" />,
        color: "from-red-500 to-orange-500",
    },
    {
        name: "Văn Phòng",
        slug: "laptop-van-phong",
        icon: <Briefcase className="h-8 w-8" />,
        color: "from-blue-500 to-cyan-500",
    },
    {
        name: "Sinh viên",
        slug: "laptop-sinh-vien",
        icon: <GraduationCap className="h-8 w-8" />,
        color: "from-green-500 to-emerald-500",
    },
    {
        name: "Cảm ứng",
        slug: "laptop-cam-ung",
        icon: <Layers className="h-8 w-8" />,
        color: "from-indigo-500 to-purple-500",
    },
    {
        name: "Đồ họa",
        slug: "laptop-do-hoa",
        icon: <Palette className="h-8 w-8" />,
        color: "from-pink-500 to-rose-500",
    },
    {
        name: "Mỏng nhẹ",
        slug: "laptop-mong-nhe",
        icon: <Zap className="h-8 w-8" />,
        color: "from-yellow-500 to-orange-500",
    },
    {
        name: "Workstation",
        slug: "laptop-workstation",
        icon: <Laptop className="h-8 w-8" />,
        color: "from-gray-600 to-gray-800",
    },
];

export function CategoryQuickLinks() {
    return (
        <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Chọn mua laptop theo nhu cầu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
                {CATEGORY_LINKS.map((category) => (
                    <Link
                        key={category.slug}
                        href={`/products?category=${category.slug}`}
                        className="group"
                    >
                        <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all">
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
                                {category.icon}
                            </div>
                            <span className="text-xs text-center font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2">
                                {category.name}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
