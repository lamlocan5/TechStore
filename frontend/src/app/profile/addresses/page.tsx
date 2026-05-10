"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth.store";
import { Header } from "@/components/layout/Header";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { AddressList } from "@/components/profile/AddressList";

export default function AddressesPage() {
    const router = useRouter();
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    // Note: loadUser is now handled by Header component

    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, hasHydrated, router]);

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
                        <span className="text-foreground font-medium">Địa chỉ</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Địa chỉ của tôi</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Quản lý địa chỉ giao hàng của bạn
                    </p>
                </div>

                {/* Layout with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <ProfileSidebar />

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <AddressList />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
