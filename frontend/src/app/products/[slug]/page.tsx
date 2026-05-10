"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getProductById, getProductsByBrand } from "@/lib/api/product.service";
import { getReviewsByProductId, calculateReviewStats } from "@/lib/api/review.service";
import { extractIdFromSlug } from "@/lib/utils/slug";
import { Header } from "@/components/layout/Header";
import { ChevronRight, ShoppingCart, Heart, Share2, Check, Star, Package, Shield, Truck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useCartStore } from "@/lib/store/cart.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { cn } from "@/lib/utils";
import { ImageGallery } from "@/components/products/ImageGallery";
import { AnimatedPrice } from "@/components/ui/AnimatedPrice";
import { ProductVariantSelector } from "@/components/products/ProductVariantSelector";
import { CartToast } from "@/components/ui/CartToast";
import { ExpandableDescription } from "@/components/ui/ExpandableDescription";
import { LoginDialog } from "@/components/ui/LoginDialog";
import type { ProductVariant } from "@/types";
import { ReviewStats } from "@/components/reviews/ReviewStats";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic imports for below-the-fold components (reduces initial bundle size)
const RelatedProducts = dynamic(
    () => import("@/components/products/RelatedProducts").then(m => m.RelatedProducts),
    { loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" /> }
);
const ReviewForm = dynamic(
    () => import("@/components/reviews/ReviewForm").then(m => m.ReviewForm),
    { loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" /> }
);
const ReviewsList = dynamic(
    () => import("@/components/reviews/ReviewsList").then(m => m.ReviewsList),
    { loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" /> }
);

export default function ProductDetailPage() {
    const params = useParams();
    const slugWithId = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const [activeTab, setActiveTab] = useState("description");
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
    const { addItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [loginAction, setLoginAction] = useState<"cart" | "wishlist" | "buy">("cart");
    const [isBuying, setIsBuying] = useState(false);

    // Extract ID from slug (format: {slug}-{id})
    const productId = slugWithId ? extractIdFromSlug(slugWithId) : null;

    // Fetch product by ID - OPTIMIZED!
    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", productId],
        queryFn: () => getProductById(productId as number),
        enabled: !!productId && !isNaN(productId),
    });

    // Fetch related products by same brand (limit 10)
    const { data: relatedProductsData } = useQuery({
        queryKey: ["products-by-brand", product?.brandId],
        queryFn: () => getProductsByBrand({ brandId: product!.brandId, page: 1, limit: 10 }),
        enabled: !!product?.brandId,
    });

    // Fetch reviews for this product
    const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
        queryKey: ["reviews", productId],
        queryFn: () => getReviewsByProductId(productId as number, 1, 20),
        enabled: !!productId && !isNaN(productId),
    });

    const reviews = reviewsData?.result || [];
    const reviewStats = calculateReviewStats(reviews);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 bg-gray-200 rounded mb-8" />
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="aspect-square bg-gray-200 rounded" />
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 rounded" />
                                <div className="h-6 bg-gray-200 rounded w-3/4" />
                                <div className="h-12 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-red-600">Không tìm thấy sản phẩm</p>
                        <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
                            Quay lại danh sách sản phẩm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Parse images
    const parseImages = (imagesStr: string): string[] => {
        if (!imagesStr) return [];
        const cleaned = imagesStr.replace(/[\[\]"']/g, '');
        return cleaned.split(',')
            .map(img => img.trim())
            .filter(img => img.length > 0 && (img.startsWith('http://') || img.startsWith('https://')));
    };

    const images = product.images
        ? parseImages(product.images)
        : (product.avatar || product.firstImage) ? [product.avatar || product.firstImage] : [];
    const validImages = images.length > 0 ? images : ['/placeholder-product.png'];

    const discount = product.priceSale < product.priceList
        ? Math.round(((product.priceList - product.priceSale) / product.priceList) * 100)
        : 0;
    const savings = product.priceList - product.priceSale;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const inWishlist = isInWishlist(product.id);

    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            setLoginAction("wishlist");
            setLoginDialogOpen(true);
            return;
        }

        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            setLoginAction("cart");
            setLoginDialogOpen(true);
            return;
        }

        try {
            // Get selected variant or first variant
            const variant = selectedVariant || (product.variants as ProductVariant[])?.[0];
            const variantId = variant?.id || product.id;
            const variantName = variant
                ? [variant.color, variant.ramGb ? `${variant.ramGb}GB RAM` : null, variant.storageGb ? `${variant.storageGb >= 1000 ? (variant.storageGb / 1000) + 'TB' : variant.storageGb + 'GB'} SSD` : null].filter(Boolean).join(" - ")
                : "";
            const variantPrice = variant?.priceSale || variant?.priceList || product.priceSale || product.priceList;

            await addItem({
                productId: product.id,
                variantId: variantId,
                quantity: 1,
                price: variantPrice,
                attributesName: variantName,
            });

            // Show custom toast with product info
            toast.custom((t) => (
                <CartToast
                    productName={product.name}
                    productImage={validImages[0]}
                    quantity={1}
                    price={product.priceSale}
                    onClose={() => toast.dismiss(t.id)}
                />
            ), {
                duration: 5000,
            });
        } catch (error) {
            console.error("Add to cart error:", error);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) {
            setLoginAction("buy");
            setLoginDialogOpen(true);
            return;
        }

        try {
            setIsBuying(true);

            // Get variant info - use selectedVariant or first variant
            const variant = selectedVariant || (product.variants as ProductVariant[])?.[0];
            const variantId = variant?.id || product.id;
            const variantName = variant
                ? [variant.color, variant.ramGb ? `${variant.ramGb}GB` : null, variant.storageGb ? `${variant.storageGb}GB` : null].filter(Boolean).join(" - ")
                : "";

            // Add to cart silently (no toast for Buy Now flow)
            await addItem({
                productId: product.id,
                variantId: variantId,
                quantity: 1,
                price: variant?.priceSale || product.priceSale || product.priceList,
                attributesName: variantName,
                silent: true, // Don't show "Added to cart" toast
            });

            // Select only this item for checkout
            const { setSelectedItemIds, fetchCart } = useCartStore.getState();
            await fetchCart(); // Refresh cart to get the new item
            const cart = useCartStore.getState().cart;

            // Find the item we just added (by productId and variantId)
            const addedItem = cart?.items.find(
                item => item.productId === product.id && item.variantId === variantId
            );

            if (addedItem) {
                setSelectedItemIds([addedItem.id]);
            }

            // Navigate to checkout (with preorder flag if applicable)
            const checkoutUrl = isPreorder ? "/checkout?preorder=true" : "/checkout";
            router.push(checkoutUrl);
        } catch (error) {
            console.error("Buy now error:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsBuying(false);
        }
    };

    // Get variants from product (real data from API)
    const variants = (product.variants as ProductVariant[]) || [];

    // Get specs to show - fallback to first variant's specs if selected variant has no specs
    // (This is because only the first variant typically has full specs data)
    const specsToShow = (selectedVariant?.specs && selectedVariant.specs.length > 0)
        ? selectedVariant.specs
        : variants[0]?.specs || [];

    // Preorder detection:
    // - If product has allowPreorder flag
    // - OR if selected variant is out of stock (stock === 0)
    const isOutOfStock = selectedVariant?.stock === 0;
    const allowPreorder = (product as any).allowPreorder === true;
    const isPreorder = isOutOfStock || allowPreorder;

    const tabs = [
        { id: "description", label: "Mô tả sản phẩm" },
        { id: "specs", label: "Thông số chi tiết" },
        { id: "reviews", label: "Đánh giá" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Breadcrumb */}
            <div className="border-b bg-white">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/products" className="hover:text-primary transition-colors">
                            Sản phẩm
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        {product.brand && (
                            <>
                                <Link href={`/brands/${product.brand.id}`} className="hover:text-primary transition-colors">
                                    {product.brand.name}
                                </Link>
                                <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                        <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Product Detail */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left - Images (4 columns) */}
                    <div className="lg:col-span-4">
                        <ImageGallery
                            images={validImages}
                            productName={product.name}
                            discount={discount}
                        />

                        {/* Short Description below gallery */}
                        {product.shortDescription && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="bg-white rounded-lg p-4 mt-4 border border-gray-200"
                            >
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả ngắn</h3>
                                <ExpandableDescription
                                    content={product.shortDescription}
                                    maxLength={500}
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Middle - Product Info (5 columns) */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-lg p-6 space-y-4"
                        >
                            {/* Brand */}
                            {product.brand && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Thương hiệu:</span>
                                    <Link href={`/brands/${product.brand.id}`} className="text-sm font-medium text-primary hover:underline">
                                        {product.brand.name}
                                    </Link>
                                    <Badge variant="outline" className="ml-auto">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Chính hãng
                                    </Badge>
                                </div>
                            )}

                            {/* Product Name */}
                            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

                            {/* Rating & Reviews (Mock) */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">(128 đánh giá)</span>
                                <span className="text-sm text-gray-400">|</span>
                                <span className="text-sm text-gray-600">Đã bán: 256</span>
                            </div>

                            {/* Animated Price - Updates with selected variant */}
                            <AnimatedPrice
                                currentPrice={selectedVariant?.priceSale || product.priceSale}
                                originalPrice={selectedVariant?.priceList || product.priceList}
                                discount={(() => {
                                    const list = selectedVariant?.priceList || product.priceList;
                                    const sale = selectedVariant?.priceSale || product.priceSale;
                                    return sale < list ? Math.round(((list - sale) / list) * 100) : 0;
                                })()}
                                savings={(selectedVariant?.priceList || product.priceList) - (selectedVariant?.priceSale || product.priceSale)}
                            />

                            {/* Variant Selector */}
                            {variants.length > 0 && (
                                <ProductVariantSelector
                                    variants={variants}
                                    selectedVariantId={selectedVariant?.id}
                                    onVariantChange={setSelectedVariant}
                                />
                            )}

                            {/* Promotions */}
                            <div className="border rounded-lg p-4 space-y-2">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Ưu đãi đặc biệt
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Nhập mã <strong className="text-primary">FREESHIP</strong> miễn phí vận chuyển đơn từ 900.000đ</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Giảm ngay 200.000đ khi thanh toán qua VNPAY</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Trả góp 0% qua thẻ tín dụng (3-6 tháng)</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Bảo hành chính hãng 24 tháng</span>
                                    </div>
                                </div>
                            </div>

                            {/* Buy Buttons */}
                            <div className="space-y-3">
                                {/* Preorder Badge */}
                                {isPreorder && (
                                    <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                                        <div className="p-1.5 bg-violet-100 rounded-full">
                                            <Package className="h-4 w-4 text-violet-600" />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium text-violet-700">
                                                {isOutOfStock ? "Sản phẩm tạm hết hàng" : "Hỗ trợ đặt trước"}
                                            </span>
                                            <span className="text-violet-600 ml-1">
                                                - Đặt trước để nhận hàng sớm nhất khi có
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className={cn(
                                        "w-full text-white text-lg h-12",
                                        isPreorder
                                            ? "bg-violet-600 hover:bg-violet-700"
                                            : "bg-red-600 hover:bg-red-700"
                                    )}
                                    onClick={handleBuyNow}
                                    disabled={isBuying}
                                >
                                    {isBuying ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : isPreorder ? (
                                        <>
                                            <Package className="h-5 w-5 mr-2" />
                                            ĐẶT TRƯỚC NGAY
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="h-5 w-5 mr-2" />
                                            MUA NGAY
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className={cn(
                                        "w-full h-12",
                                        isPreorder
                                            ? "border-violet-500 text-violet-600 hover:bg-violet-50"
                                            : "border-primary text-primary hover:bg-primary/10"
                                    )}
                                    onClick={handleAddToCart}
                                >
                                    {isPreorder ? "THÊM VÀO ĐẶT TRƯỚC" : "THÊM VÀO GIỎ HÀNG"}
                                </Button>
                            </div>

                            {/* Delivery Info */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Giao hàng nhanh 2h</span>
                                    <span className="text-gray-500">- Miễn phí với đơn từ 900.000đ</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Đổi trả trong 10 ngày</span>
                                    <span className="text-gray-500">- Nếu sản phẩm lỗi</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right - Specs (3 columns) */}
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white rounded-lg p-6"
                        >
                            <h2 className="text-lg font-bold mb-4">Thông số kỹ thuật</h2>
                            <div className="space-y-2 text-sm">
                                {product.brand && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Thương hiệu</span>
                                        <span className="font-medium text-right">{product.brand.name}</span>
                                    </div>
                                )}
                                {/* Variant basic specs */}
                                {selectedVariant?.cpuModel && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">CPU</span>
                                        <span className="font-medium text-right">{selectedVariant.cpuModel}</span>
                                    </div>
                                )}
                                {selectedVariant?.ramGb && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">RAM</span>
                                        <span className="font-medium text-right">{selectedVariant.ramGb}GB</span>
                                    </div>
                                )}
                                {selectedVariant?.storageGb && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Ổ cứng</span>
                                        <span className="font-medium text-right">
                                            {selectedVariant.storageGb >= 1000
                                                ? `${selectedVariant.storageGb / 1000}TB SSD`
                                                : `${selectedVariant.storageGb}GB SSD`}
                                        </span>
                                    </div>
                                )}
                                {selectedVariant?.gpuModel && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Card đồ họa</span>
                                        <span className="font-medium text-right">{selectedVariant.gpuModel}</span>
                                    </div>
                                )}
                                {selectedVariant?.os && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Hệ điều hành</span>
                                        <span className="font-medium text-right">{selectedVariant.os}</span>
                                    </div>
                                )}
                                {selectedVariant?.weightG && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Trọng lượng</span>
                                        <span className="font-medium text-right">{(selectedVariant.weightG / 1000).toFixed(2)}kg</span>
                                    </div>
                                )}
                                {selectedVariant?.color && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Màu sắc</span>
                                        <span className="font-medium text-right">{selectedVariant.color}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Animated Tabs Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 bg-white rounded-lg overflow-hidden"
                >
                    {/* Tab Navigation */}
                    <div className="border-b relative">
                        <div className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "relative px-6 py-3 text-sm font-medium transition-colors",
                                        activeTab === tab.id
                                            ? "text-primary"
                                            : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === "description" && (
                                <motion.div
                                    key="description"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ExpandableDescription
                                        content={product.description}
                                        maxLength={1000}
                                    />
                                </motion.div>
                            )}

                            {activeTab === "specs" && (
                                <motion.div
                                    key="specs"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {specsToShow.length > 0 ? (
                                        <div className="space-y-6">
                                            {/* Group specs by category */}
                                            {(() => {
                                                const specs = specsToShow;

                                                // Define category groupings
                                                const categories = [
                                                    {
                                                        title: "Bộ xử lý (CPU)",
                                                        keys: ["laptop_seriescpu", "laptop_thehecpu", "laptop_tocdoxulycpu", "laptop_sonhanluongxulycpu", "laptop_bonhocachecpu", "Laptop_thehecpufilter"]
                                                    },
                                                    {
                                                        title: "Đồ họa (GPU)",
                                                        keys: ["laptop_chipdohoatichhop", "laptop_segmentation"]
                                                    },
                                                    {
                                                        title: "Bộ nhớ RAM",
                                                        keys: ["laptop_dungluongbonho", "laptop_thehebonho", "laptop_busram", "laptop_sokhecamram", "laptop_dungluongbonhotoida", "ram_range"]
                                                    },
                                                    {
                                                        title: "Ổ cứng",
                                                        keys: ["ssd_range", "laptop_sokhecamm2"]
                                                    },
                                                    {
                                                        title: "Màn hình",
                                                        keys: ["laptop_kichthuocmanhinh", "laptop_dophangiaimanhinh", "laptop_chuandophangiaimanhinh", "laptop_congnghetamnenmanhinh", "laptop_tansoquetmanhinh", "laptop_bematmanhinh", "do_sang_man_hinh_laptop", "do_phu_mau", "laptop_manhinhcamung"]
                                                    },
                                                    {
                                                        title: "Kết nối",
                                                        keys: ["laptop_socongusbc", "laptop_socongusb31", "laptop_soconghdmi", "laptop_socongketnoiamthanh", "laptop_ketnoilan", "laptop_ketnoiwlan", "laptop_ketnoibluetooth"]
                                                    },
                                                    {
                                                        title: "Bàn phím & Bảo mật",
                                                        keys: ["laptop_banphimco", "laptop_banphimso", "laptop_dennenbanphim", "laptop_baomat", "bao_mat_khac"]
                                                    },
                                                    {
                                                        title: "Pin & Nguồn",
                                                        keys: ["laptop_congsuatpin", "laptop_dungluongpin", "laptop_kieupin"]
                                                    },
                                                    {
                                                        title: "Thiết kế & Kích thước",
                                                        keys: ["laptop_kichthuoc", "laptop_khoiluong", "chat_lieu_laptop"]
                                                    },
                                                    {
                                                        title: "Thông tin khác",
                                                        keys: ["laptop_series", "laptop_ten", "laptop_partnumber", "nhucausudung", "laptop_hedieuhanhrutgon", "laptop_webcam", "cong_nghe_am_thanh_laptop", "laptop_phukiendikem", "npu_tops"]
                                                    }
                                                ];

                                                return (
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        {categories.map((category) => {
                                                            const categorySpecs = specs.filter(s => category.keys.includes(s.attributeKey));
                                                            if (categorySpecs.length === 0) return null;

                                                            return (
                                                                <div key={category.title} className="space-y-2">
                                                                    <h3 className="font-bold text-base text-gray-900 pb-2 border-b-2 border-primary/20">
                                                                        {category.title}
                                                                    </h3>
                                                                    <div className="space-y-1">
                                                                        {categorySpecs.map((spec) => (
                                                                            <div key={spec.id} className="flex justify-between py-2 border-b border-gray-100 hover:bg-gray-50 px-2 -mx-2 rounded">
                                                                                <span className="text-sm text-gray-600">{spec.attributeLabel}</span>
                                                                                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{spec.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Chưa có thông số chi tiết cho phiên bản này</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "reviews" && (
                                <motion.div
                                    key="reviews"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    {/* Review Stats */}
                                    <ReviewStats stats={reviewStats} />

                                    {/* Review Form */}
                                    <ReviewForm
                                        productId={product.id}
                                        hasPurchased={true} // TODO: Check if user purchased
                                        onSuccess={() => refetchReviews()}
                                    />

                                    {/* Reviews List */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Tất cả đánh giá ({reviewStats.totalReviews})
                                        </h3>
                                        <ReviewsList
                                            reviews={reviews}
                                            isLoading={reviewsLoading}
                                            hasMore={false}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Related Products - Same Brand */}
                {relatedProductsData && relatedProductsData.result.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-6"
                    >
                        <RelatedProducts
                            products={relatedProductsData.result}
                            currentProductId={String(product.id)}
                        />
                    </motion.div>
                )}
            </div>

            {/* Login Dialog */}
            <LoginDialog
                isOpen={loginDialogOpen}
                onClose={() => setLoginDialogOpen(false)}
                action={loginAction}
            />
        </div>
    );
}
