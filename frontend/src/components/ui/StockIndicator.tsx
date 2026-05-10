import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface StockIndicatorProps {
    stock: number;
    lowStockThreshold?: number;
    size?: "sm" | "md" | "lg";
}

export function StockIndicator({ stock, lowStockThreshold = 10, size = "md" }: StockIndicatorProps) {
    const getStockStatus = () => {
        if (stock === 0) {
            return {
                label: "Hết hàng",
                variant: "destructive" as const,
                color: "text-red-600",
                bgColor: "bg-red-50",
            };
        }
        if (stock <= lowStockThreshold) {
            return {
                label: `Chỉ còn ${stock} sản phẩm`,
                variant: "warning" as const,
                color: "text-orange-600",
                bgColor: "bg-orange-50",
            };
        }
        return {
            label: "Còn hàng",
            variant: "success" as const,
            color: "text-green-600",
            bgColor: "bg-green-50",
        };
    };

    const status = getStockStatus();

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
    };

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full ${status.bgColor} ${sizeClasses[size]}`}>
            <Package className={`h-3 w-3 ${status.color}`} />
            <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
    );
}

// Compact version for product cards
export function StockBadge({ stock }: { stock: number }) {
    if (stock === 0) {
        return (
            <Badge variant="destructive" className="text-xs">
                Hết hàng
            </Badge>
        );
    }
    if (stock <= 5) {
        return (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-50">
                Còn {stock}
            </Badge>
        );
    }
    return null; // Don't show if plenty in stock
}
