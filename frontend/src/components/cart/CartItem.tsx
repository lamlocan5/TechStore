"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "./QuantitySelector";
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
import type { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/lib/store/cart.store";
import { useQuery } from "@tanstack/react-query";
import { getProductById } from "@/lib/api/product.service";
import { generateProductSlug } from "@/lib/utils/slug";

interface CartItemProps {
    item: CartItemType;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export function CartItem({ item, isSelected = false, onToggleSelect }: CartItemProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { updateItem, removeItem, isLoading } = useCartStore();

    // Fetch product details
    const { data: product } = useQuery({
        queryKey: ["product", item.productId],
        queryFn: () => getProductById(item.productId),
        enabled: !!item.productId,
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const handleQuantityChange = async (newQuantity: number) => {
        await updateItem(item.id, newQuantity);
    };

    const handleRemove = async () => {
        await removeItem(item.id);
        setShowDeleteDialog(false);
    };

    const productImage = product?.avatar || product?.firstImage || "/placeholder-product.png";
    const productName = product?.name || "Đang tải...";
    const productSlug = product ? generateProductSlug(product.slug, product.id) : "#";
    const itemTotal = item.priceSnapshot * item.quantity;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white rounded-xl border-2 transition-all duration-200 ${isSelected
                    ? 'border-primary/50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                    }`}
            >
                <div className="p-4">
                    <div className="flex gap-4">
                        {/* Selection Checkbox */}
                        {onToggleSelect && (
                            <div className="flex items-start pt-2">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={onToggleSelect}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Product Image */}
                        <Link href={`/products/${productSlug}`} className="flex-shrink-0 group">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <Image
                                    src={productImage}
                                    alt={productName}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                            </div>
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/products/${productSlug}`}
                                className="block group"
                            >
                                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                    {productName}
                                </h3>
                            </Link>

                            {/* Variant Info */}
                            {item.attributesName && (
                                <p className="text-sm text-gray-600 mb-2">
                                    {item.attributesName}
                                </p>
                            )}

                            {/* Price & Quantity */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Đơn giá:</span>
                                    <span className="font-semibold text-primary">
                                        {formatPrice(item.priceSnapshot)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <QuantitySelector
                                        value={item.quantity}
                                        onChange={handleQuantityChange}
                                        disabled={isLoading}
                                        min={1}
                                        max={99}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Section: Total & Delete */}
                        <div className="flex flex-col items-end justify-between">
                            {/* Total Price */}
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Thành tiền</p>
                                <p className="text-xl font-bold text-primary">
                                    {formatPrice(itemTotal)}
                                </p>
                            </div>

                            {/* Delete Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={isLoading}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa sản phẩm khỏi giỏ hàng?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
