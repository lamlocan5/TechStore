"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import type { Review } from "@/types/review";

interface ReviewsListProps {
    reviews: Review[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export function ReviewsList({ reviews, isLoading, hasMore, onLoadMore }: ReviewsListProps) {
    if (isLoading && reviews.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                                <div className="h-16 bg-gray-200 rounded w-full mt-2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200"
            >
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có đánh giá nào
                </h3>
                <p className="text-gray-600">
                    Hãy là người đầu tiên đánh giá sản phẩm này!
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {reviews.map((review, index) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <ReviewCard review={review} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className="border-2 hover:border-primary hover:bg-primary/5"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Đang tải...
                            </>
                        ) : (
                            "Xem thêm đánh giá"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
