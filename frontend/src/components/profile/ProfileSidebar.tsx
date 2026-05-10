"use client";

import { motion } from "framer-motion";
import { User, Package, MapPin, Lock, Heart, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
    { icon: User, label: "Thông tin tài khoản", href: "/profile" },
    { icon: MapPin, label: "Địa chỉ", href: "/profile/addresses" },
    { icon: Lock, label: "Đổi mật khẩu", href: "/profile/change-password" },
];

export function ProfileSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        router.push("/login");
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
            {/* Menu Items */}
            <nav className="p-2">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    whileHover={{ x: 3 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                                    )} />
                                </motion.div>

                                {/* Label */}
                                <span className="flex-1">{item.label}</span>

                                {/* Arrow */}
                                <ChevronRight className={cn(
                                    "h-4 w-4 transition-all duration-200",
                                    isActive
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                )} />
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Divider */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"
            />

            {/* Logout Button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="p-2"
            >
                <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                </Button>
            </motion.div>
        </motion.div>
    );
}
