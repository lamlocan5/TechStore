"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, CreditCard } from "lucide-react";

interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
    action: "cart" | "wishlist" | "buy";
    redirectUrl?: string;
}

export function LoginDialog({ isOpen, onClose, action, redirectUrl }: LoginDialogProps) {
    const router = useRouter();

    const handleLogin = () => {
        const currentPath = redirectUrl || window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        onClose();
    };

    const actionConfig = {
        cart: { text: "thêm vào giỏ hàng", icon: ShoppingCart },
        wishlist: { text: "thêm vào yêu thích", icon: Heart },
        buy: { text: "mua ngay", icon: CreditCard },
    };

    const { text: actionText, icon: Icon } = actionConfig[action];

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <AlertDialogTitle className="text-xl">
                            Yêu cầu đăng nhập
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base">
                        Bạn cần đăng nhập để {actionText}. Bạn có muốn chuyển đến trang đăng nhập không?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogin}>
                        Đăng nhập
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
