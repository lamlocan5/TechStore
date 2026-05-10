"use client";

import { useEffect, useState } from "react";
import { getProductById } from "@/lib/api/product.service";
import type { OrderItem } from "@/types/order";
import type { Product } from "@/types";
import Image from "next/image";
import { Package, Loader2 } from "lucide-react";

interface OrderItemCardProps {
    item: OrderItem;
    showImage?: boolean;
}

export function OrderItemCard({ item, showImage = true }: OrderItemCardProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const data = await getProductById(item.productId);
                setProduct(data);
            } catch (err) {
                // Keep using item data if API fails
            } finally {
                setIsLoading(false);
            }
        };

        if (item.productId && showImage) {
            fetchProduct();
        } else {
            setIsLoading(false);
        }
    }, [item.productId, showImage]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    // Get product image
    const getProductImage = (): string | null => {
        if (!product?.images) return null;

        // Parse images string (could be JSON array or comma-separated)
        try {
            const imagesStr = product.images;
            const cleaned = imagesStr.replace(/[\[\]"']/g, '');
            const urls = cleaned.split(',').map(url => url.trim()).filter(Boolean);
            return urls[0] || null;
        } catch {
            return null;
        }
    };

    const imageUrl = getProductImage();
    const productName = product?.name || item.productName;

    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            {/* Product Image */}
            {showImage && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                    ) : imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-300" />
                        </div>
                    )}
                </div>
            )}

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {productName}
                </p>

                {/* SKU & Attributes */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.sku && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            SKU: {item.sku}
                        </span>
                    )}
                    {item.attributesName && (
                        <span className="text-xs text-gray-600">
                            {item.attributesName}
                        </span>
                    )}
                </div>
            </div>

            {/* Price & Quantity */}
            <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                    {formatPrice(item.price * item.quantity)}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                    x{item.quantity}
                </span>
            </div>
        </div>
    );
}
