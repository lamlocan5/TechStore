"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth.store";
import { Header } from "@/components/layout/Header";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { RankBadge } from "@/components/profile/RankBadge";
import type { UserRank } from "@/types/voucher";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    // Note: loadUser is now handled by Header component

    useEffect(() => {
        // Only redirect after hydration is complete
        if (hasHydrated && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router, hasHydrated]);

    // Show loading while hydrating or if user is null
    if (!hasHydrated || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Đang tải...</p>
            </div>
        );
    }

    const userRank = (user.rank as UserRank) || "BRONZE";
    const totalSpent = user.totalSpent || 0;

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
                        <span className="text-foreground font-medium">Tài khoản</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Page Title & Rank Badge */}
                <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Tài khoản của tôi</h1>
                        <p className="text-muted-foreground">
                            Xin chào, <span className="font-medium text-foreground">{user.lastName} {user.firstName}</span>! 👋
                        </p>
                    </div>
                    <div className="md:w-72">
                        <RankBadge rank={userRank} totalSpent={totalSpent} showProgress size="md" />
                    </div>
                </div>

                {/* Layout with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <ProfileSidebar />

                    {/* Main Content */}
                    <div className="flex-1">
                        <ProfileInfo />
                    </div>
                </div>
            </div>
        </div>
    );
}
