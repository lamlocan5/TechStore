"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { Header } from "@/components/layout/Header";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    const [showNotice, setShowNotice] = useState(false);
    // Note: loadUser is now handled by Header component

    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, hasHydrated, router]);

    // Check if user came from forgot password flow
    useEffect(() => {
        const showChangePasswordNotice = localStorage.getItem("showChangePasswordNotice");
        if (showChangePasswordNotice === "true") {
            setShowNotice(true);
            localStorage.removeItem("showChangePasswordNotice");
        }
    }, []);

    if (!hasHydrated || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <Header />

            {/* Notice for users who forgot password */}
            <AnimatePresence>
                {showNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="bg-amber-500 text-white"
                    >
                        <div className="container mx-auto px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-full">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Bạn đang sử dụng mật khẩu tạm thời!</p>
                                        <p className="text-sm text-white/90">
                                            Vui lòng đổi mật khẩu mới để bảo mật tài khoản của bạn.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotice(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Breadcrumb */}
            <div className="border-b bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/profile" className="hover:text-foreground transition-colors">
                            Tài khoản
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-medium">Đổi mật khẩu</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Đổi mật khẩu</h1>
                    <p className="text-muted-foreground">
                        {showNotice
                            ? "Vui lòng nhập mật khẩu tạm thời và đặt mật khẩu mới cho tài khoản"
                            : "Cập nhật mật khẩu để bảo mật tài khoản của bạn"}
                    </p>
                </div>

                {/* Layout with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <ProfileSidebar />

                    {/* Main Content */}
                    <div className="flex-1 max-w-2xl">
                        <ChangePasswordForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
