"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyCart() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <ShoppingBag className="h-24 w-24 text-gray-300 relative" strokeWidth={1.5} />
                </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Giỏ hàng trống
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-sm">
                Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>

            <Button asChild className="gap-2">
                <Link href="/products">
                    <ShoppingBag className="h-4 w-4" />
                    Tiếp tục mua sắm
                </Link>
            </Button>
        </div>
    );
}
