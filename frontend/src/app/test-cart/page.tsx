"use client";

import { useState } from "react";
import { QuantitySelector } from "@/components/cart/QuantitySelector";
import { CartItem } from "@/components/cart/CartItem";
import { EmptyCart } from "@/components/cart/EmptyCart";
import type { CartItem as CartItemType } from "@/types";

export default function CartTestPage() {
    const [quantity, setQuantity] = useState(1);

    // Mock cart item for testing
    const mockCartItem: CartItemType = {
        id: 1,
        productId: 1,
        variantId: 1,
        quantity: 2,
        price: 15000000,
        attributesName: "Màu Đen - 16GB RAM",
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">Cart Components Test</h1>

                {/* QuantitySelector Test */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">1. QuantitySelector</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Small Size:</p>
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                size="sm"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Medium Size (Default):</p>
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                size="md"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Large Size:</p>
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                size="lg"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Disabled:</p>
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                disabled
                            />
                        </div>
                        <p className="text-sm font-medium">Current Value: {quantity}</p>
                    </div>
                </div>

                {/* CartItem Test */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">2. CartItem</h2>
                    <CartItem item={mockCartItem} />
                </div>

                {/* EmptyCart Test */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">3. EmptyCart</h2>
                    <EmptyCart />
                </div>
            </div>
        </div>
    );
}
