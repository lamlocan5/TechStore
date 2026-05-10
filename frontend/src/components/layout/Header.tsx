"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, ShoppingCart, User, LogOut, Ticket, MapPin, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import { SearchBar } from "@/components/layout/SearchBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
    const { user, isAuthenticated, logout, loadUser, hasHydrated } = useAuthStore();
    const { cart, fetchCart } = useCartStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const totalItems = cart?.totalItems || 0;

    // Initialize auth and cart when hydrated - Header is on every page
    React.useEffect(() => {
        if (hasHydrated) {
            loadUser(); // Single place to load user
        }
    }, [hasHydrated, loadUser]);

    // Fetch cart when authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        }
    }, [isAuthenticated, fetchCart]);

    // Close drawer on ESC key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isCartOpen) {
                setIsCartOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isCartOpen]);

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary flex-shrink-0">
                        <ShoppingBag className="h-8 w-8" />
                        <span>TechStore</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="hidden md:block flex-1">
                        <SearchBar />
                    </div>

                    <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
                        <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                            Sản phẩm
                        </Link>
                        <Link href="/brands" className="text-sm font-medium hover:text-primary transition-colors">
                            Thương hiệu
                        </Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        {/* Cart Icon with Badge */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            onClick={() => setIsCartOpen(true)}
                            aria-label="Giỏ hàng"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {totalItems > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                    className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                                >
                                    {totalItems > 99 ? "99+" : totalItems}
                                </motion.span>
                            )}
                        </Button>

                        {isAuthenticated && user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium">{user.lastName} {user.firstName}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="cursor-pointer">
                                            <User className="h-4 w-4 mr-2" />
                                            Thông tin cá nhân
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/orders" className="cursor-pointer">
                                            <ShoppingBag className="h-4 w-4 mr-2" />
                                            Đơn hàng của tôi
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/vouchers" className="cursor-pointer">
                                            <Ticket className="h-4 w-4 mr-2" />
                                            Mã giảm giá
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Đăng xuất
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                                    Đăng nhập
                                </Link>
                                <Link href="/register" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </header>
    );
}
