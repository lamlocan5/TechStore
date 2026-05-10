"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Cpu, HardDrive, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useCartStore } from "@/lib/store/cart.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useRouter } from "next/navigation";
import { getVariantsByProduct, getVariantSpecs } from "@/lib/api/product.service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { generateProductSlug } from "@/lib/utils/slug";
import toast from "react-hot-toast";
import { CartToast } from "@/components/ui/CartToast";
import { LoginDialog } from "@/components/ui/LoginDialog";

interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
}

interface ProductSpecs {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    screen?: string;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
    const { addItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const [variants, setVariants] = useState<any[]>([]);
    const [specs, setSpecs] = useState<ProductSpecs>({});
    const [showParticles, setShowParticles] = useState(false);
    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [loginAction, setLoginAction] = useState<"cart" | "wishlist">("cart");

    const inWishlist = isInWishlist(product.id);
    const discount = product.priceSale < product.priceList
        ? Math.round(((product.priceList - product.priceSale) / product.priceList) * 100)
        : 0;
    const savings = product.priceList - product.priceSale;

    // Generate slug with ID: {slug}-{id}
    const productSlug = generateProductSlug(product.slug, product.id);

    // Fetch specs for this product
    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const variantsData = await getVariantsByProduct(product.id);
                setVariants(variantsData);

                if (variantsData.length > 0) {
                    const variant = variantsData[0];
                    const specsMap: ProductSpecs = {};

                    // Extract from variant direct fields
                    if (variant.cpuModel) {
                        // Shorten CPU name for display
                        let cpuShort = variant.cpuModel
                            .replace('Intel® Core™', '')
                            .replace('AMD Ryzen', 'Ryzen')
                            .replace('Ultra', 'U')
                            .trim();
                        specsMap.cpu = cpuShort;
                    }

                    // GPU - from gpuModel or specs
                    if (variant.gpuModel && variant.gpuModel !== 'Onboard graphics') {
                        specsMap.gpu = variant.gpuModel;
                    } else if (variant.igpu) {
                        specsMap.gpu = variant.igpu;
                    }

                    // RAM and Storage from direct fields
                    if (variant.ramGb) {
                        specsMap.ram = `${variant.ramGb}GB`;
                    }
                    if (variant.storageGb) {
                        specsMap.storage = `${variant.storageGb >= 1000 ? (variant.storageGb / 1000) + 'TB' : variant.storageGb + 'GB'}`;
                    }

                    // Screen info from specs array
                    if (variant.specs && Array.isArray(variant.specs)) {
                        const screenSize = variant.specs.find((s: any) => s.attributeKey === 'laptop_kichthuocmanhinh')?.value;
                        const resolution = variant.specs.find((s: any) => s.attributeKey === 'laptop_chuandophangiaimanhinh')?.value;
                        const panelType = variant.specs.find((s: any) => s.attributeKey === 'laptop_congnghetamnenmanhinh')?.value;
                        const refreshRate = variant.specs.find((s: any) => s.attributeKey === 'laptop_tansoquetmanhinh')?.value;
                        const igpu = variant.specs.find((s: any) => s.attributeKey === 'laptop_chipdohoatichhop')?.value;

                        // Build screen string: e.g. "14" 2.8K/OLED/120Hz"
                        const screenParts = [];
                        if (screenSize) screenParts.push(screenSize);
                        if (resolution) screenParts.push(resolution);
                        if (panelType) screenParts.push(panelType);
                        if (refreshRate) screenParts.push(refreshRate);

                        if (screenParts.length > 0) {
                            specsMap.screen = screenParts.join(' / ');
                        }

                        // Get integrated GPU from specs if not from variant
                        if (!specsMap.gpu && igpu) {
                            specsMap.gpu = igpu.replace('Intel® ', '').replace('™', '');
                        }
                    }

                    setSpecs(specsMap);
                }
            } catch (error) {
                console.error('Failed to fetch specs:', error);
            }
        };
        fetchSpecs();
    }, [product.id]);

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            setLoginAction("wishlist");
            setLoginDialogOpen(true);
            return;
        }

        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
            // Show particles animation
            setShowParticles(true);
            setTimeout(() => setShowParticles(false), 1000);
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            setLoginAction("cart");
            setLoginDialogOpen(true);
            return;
        }

        try {
            // Get first variant or use default
            const variantId = variants[0]?.id || product.id;
            const variantName = variants[0]?.attributeValues?.map((av: any) => av.value).join(" - ") || "";

            await addItem({
                productId: product.id,
                variantId: variantId,
                quantity: 1,
                price: product.priceSale || product.priceList,
                attributesName: variantName,
            });

            // Show custom toast with product info
            toast.custom((t) => (
                <CartToast
                    productName={product.name}
                    productImage={product.avatar || product.firstImage}
                    quantity={1}
                    price={product.priceSale || product.priceList}
                    onClose={() => toast.dismiss(t.id)}
                />
            ), {
                duration: 5000,
            });
        } catch (error) {
            console.error("Add to cart error:", error);
        }
    };

    // Format price in Vietnamese
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    return (
        <Tilt
            tiltMaxAngleX={5}
            tiltMaxAngleY={5}
            scale={1.02}
            transitionSpeed={400}
            className="h-full"
        >
            <Link href={`/products/${productSlug}`}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-primary-300 transition-all duration-300 flex flex-col min-h-[480px] h-full"
                >
                    {/* Discount Badge */}
                    {discount > 0 && (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-3 py-1 shadow-lg">
                                -{discount}%
                            </Badge>
                        </motion.div>
                    )}

                    {/* Product Image with Zoom */}
                    <div className="relative aspect-square bg-gray-100 overflow-hidden flex-shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full"
                        >
                            <Image
                                src={imageError ? "/placeholder-product.png" : (product.avatar || product.firstImage)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                            />
                        </motion.div>
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileHover={{ opacity: 1, y: 0 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Button
                                    size="sm"
                                    className="bg-white text-primary-600 hover:bg-primary-50"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Quick view functionality
                                    }}
                                >
                                    Xem nhanh
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3 flex flex-col flex-grow">
                        {/* Brand - Always show */}
                        <p className="text-xs text-primary-600 uppercase font-bold tracking-wide">
                            {product.brand?.name || product.brandName || "NO BRAND"}
                        </p>

                        {/* Product Name - Fixed height */}
                        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 h-8 group-hover:text-primary-600 transition-colors">
                            {product.name}
                        </h3>

                        {/* Price Section */}
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                    {formatPrice(product.priceSale)}
                                </span>
                                {discount > 0 && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(product.priceList)}
                                    </span>
                                )}
                            </div>

                            {savings > 0 && (
                                <p className="text-xs text-green-600 font-medium">
                                    Tiết kiệm {formatPrice(savings)}
                                </p>
                            )}
                        </div>

                        {/* Specs - Compact design matching reference */}
                        <div className="flex-grow space-y-1.5 min-h-[70px]">
                            {/* Row 1: CPU + GPU */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {specs.cpu && (
                                    <div className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">
                                        <Cpu className="h-2.5 w-2.5 text-blue-500" />
                                        <span className="text-gray-700 font-medium">{specs.cpu}</span>
                                    </div>
                                )}
                                {specs.gpu && (
                                    <div className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">
                                        <span className="text-gray-700 font-medium">{specs.gpu}</span>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: RAM + Storage */}
                            <div className="flex items-center gap-1.5">
                                {specs.ram && (
                                    <div className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">
                                        <HardDrive className="h-2.5 w-2.5 text-green-500" />
                                        <span className="text-gray-700 font-medium">{specs.ram}</span>
                                    </div>
                                )}
                                {specs.storage && (
                                    <div className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">
                                        <span className="text-gray-700 font-medium">{specs.storage}</span>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Screen */}
                            {specs.screen && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Monitor className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate">{specs.screen}</span>
                                </div>
                            )}
                        </div>

                        {/* Add to Cart Button - Full Width at Bottom */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-md hover:shadow-lg transition-all"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Thêm vào giỏ
                            </Button>
                        </motion.div>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
                    </div>
                </motion.div>
            </Link>
            {/* Hover Glow Effect */}
            <LoginDialog
                isOpen={loginDialogOpen}
                onClose={() => setLoginDialogOpen(false)}
                action={loginAction}
            />
        </Tilt>
    )
}
