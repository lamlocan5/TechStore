"use client";

import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, User } from "lucide-react";
import type { Review } from "@/types/review";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const hasRating = review.rating !== null;
    const userInitial = review.userId.charAt(0).toUpperCase();

    // Format relative time
    const relativeTime = formatDistanceToNow(new Date(review.createdAt), {
        addSuffix: true,
        locale: vi,
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    <User className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* User Info & Rating */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                                Người dùng #{review.userId.slice(0, 8)}
                            </p>
                            {hasRating && (
                                <div className="mt-1">
                                    <StarRating value={review.rating!} size="sm" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {relativeTime}
                        </span>
                    </div>

                    {/* Purchased Badge */}
                    {hasRating && (
                        <Badge className="mb-2 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Đã mua sản phẩm
                        </Badge>
                    )}

                    {/* Comment */}
                    {review.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {review.comment}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
