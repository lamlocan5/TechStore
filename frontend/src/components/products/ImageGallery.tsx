"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
    images: string[];
    productName: string;
    discount?: number;
}

export function ImageGallery({ images, productName, discount }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const validImages = images.length > 0 ? images : ["/placeholder-product.png"];

    const handlePrevious = () => {
        setSelectedImage((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedImage((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isLightboxOpen) return;

        if (e.key === "Escape") {
            setIsLightboxOpen(false);
        } else if (e.key === "ArrowLeft") {
            handlePrevious();
        } else if (e.key === "ArrowRight") {
            handleNext();
        }
    };

    // Keyboard navigation
    useState(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown as any);
            return () => window.removeEventListener("keydown", handleKeyDown as any);
        }
    });

    return (
        <>
            <div className="bg-white rounded-lg p-4">
                {/* Main Image */}
                <motion.div
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative mb-4 cursor-zoom-in group"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={() => setIsLightboxOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Discount Badge */}
                    {Number(discount) > 0 && (
                        <motion.div
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: -12 }}
                            className="absolute top-2 left-2 z-10 bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-lg"
                        >
                            -{discount}%
                        </motion.div>
                    )}

                    {/* Zoom Icon Hint */}
                    <AnimatePresence>
                        {isHovering && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-2 right-2 z-10 bg-black/50 text-white p-2 rounded-lg backdrop-blur-sm"
                            >
                                <ZoomIn className="h-5 w-5" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Image with Hover Zoom */}
                    <motion.div
                        className="relative w-full h-full"
                        animate={{ scale: isHovering ? 1.1 : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Image
                            src={validImages[selectedImage]}
                            alt={productName}
                            fill
                            className="object-contain p-4"
                            unoptimized={validImages[selectedImage] === "/placeholder-product.png"}
                            priority
                        />
                    </motion.div>
                </motion.div>

                {/* Thumbnails */}
                {validImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                        {validImages.slice(0, 5).map((img, idx) => (
                            <motion.button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={cn(
                                    "aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 p-1 transition-all",
                                    selectedImage === idx
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-gray-300"
                                )}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Image
                                    src={img}
                                    alt={`${productName} ${idx + 1}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain"
                                    unoptimized={img === "/placeholder-product.png"}
                                />
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </motion.button>

                        {/* Previous Button */}
                        {validImages.length > 1 && (
                            <motion.button
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevious();
                                }}
                                className="absolute left-4 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </motion.button>
                        )}

                        {/* Next Button */}
                        {validImages.length > 1 && (
                            <motion.button
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 50, opacity: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                }}
                                className="absolute right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </motion.button>
                        )}

                        {/* Lightbox Image */}
                        <motion.div
                            key={selectedImage}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="relative max-w-6xl max-h-[90vh] w-full h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={validImages[selectedImage]}
                                alt={`${productName} - Image ${selectedImage + 1}`}
                                fill
                                className="object-contain"
                                unoptimized={validImages[selectedImage] === "/placeholder-product.png"}
                                priority
                            />
                        </motion.div>

                        {/* Image Counter */}
                        {validImages.length > 1 && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium"
                            >
                                {selectedImage + 1} / {validImages.length}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
