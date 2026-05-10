"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Camera,
    Upload,
    X,
    Search,
    Loader2,
    AlertCircle,
    ImageIcon,
    Sparkles,
} from "lucide-react";
import { useImageSearch } from "@/lib/hooks/useImageSearch";
import { ImageSearchResult } from "@/types/image-search";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ImageSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResultClick?: (productId: number) => void;
}

export function ImageSearchModal({
    isOpen,
    onClose,
    onResultClick,
}: ImageSearchModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const {
        isLoading,
        error,
        results,
        previewUrl,
        selectedFile,
        selectFile,
        clearFile,
        search,
        reset,
    } = useImageSearch(10);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                selectFile(file);
            }
        },
        [selectFile]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) {
                selectFile(file);
            }
        },
        [selectFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleResultClick = useCallback(
        (productId: number) => {
            if (onResultClick) {
                onResultClick(productId);
            }
            handleClose();
        },
        [onResultClick, handleClose]
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        Tìm kiếm bằng hình ảnh
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Upload Area */}
                    {!previewUrl && !results.length && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                relative border-2 border-dashed rounded-xl p-8
                                transition-colors duration-200 cursor-pointer
                                ${isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                }
                            `}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        Kéo thả hình ảnh vào đây
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        hoặc click để chọn file
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Hỗ trợ: JPEG, PNG, WebP, GIF (tối đa 5MB)
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Preview Area */}
                    {previewUrl && !results.length && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                />
                                <button
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </motion.div>
                            )}

                            {/* Search Button */}
                            <Button
                                onClick={search}
                                disabled={isLoading}
                                className="w-full"
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tìm kiếm...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Tìm sản phẩm tương tự
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {/* Results Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="font-medium">
                                        Tìm thấy {results.length} sản phẩm tương tự
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={reset}
                                >
                                    Tìm kiếm mới
                                </Button>
                            </div>

                            {/* Preview Thumbnail */}
                            {previewUrl && (
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                        <Image
                                            src={previewUrl}
                                            alt="Query"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Ảnh tìm kiếm của bạn
                                    </span>
                                </div>
                            )}

                            {/* Results List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                <AnimatePresence>
                                    {results.map((result, index) => (
                                        <ResultItem
                                            key={result.product.id}
                                            result={result}
                                            index={index}
                                            onClick={() => handleResultClick(result.product.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {/* Loading Overlay */}
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                                        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">Đang phân tích hình ảnh...</p>
                                        <p className="text-sm text-muted-foreground">
                                            Sử dụng AI để tìm sản phẩm tương tự
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Result Item Component
function ResultItem({
    result,
    index,
    onClick,
}: {
    result: ImageSearchResult;
    index: number;
    onClick: () => void;
}) {
    const { product, similarity } = result;
    const similarityPercent = Math.round(similarity * 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                href={`/products/${product.id}`}
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
                {/* Product Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.avatar || product.firstImage ? (
                        <Image
                            src={product.avatar || product.firstImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-primary">
                            {formatPrice(product.priceSale || product.priceList)}
                        </span>
                        {product.priceSale && product.priceSale < product.priceList && (
                            <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.priceList)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
