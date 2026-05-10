"use client";

import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { Star, TrendingUp } from "lucide-react";
import type { ReviewStats as ReviewStatsType } from "@/types/review";

interface ReviewStatsProps {
    stats: ReviewStatsType;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
    const { averageRating, totalReviews, totalWithRating, ratingDistribution } = stats;

    // Calculate percentage for each rating
    const getPercentage = (count: number) => {
        if (totalWithRating === 0) return 0;
        return Math.round((count / totalWithRating) * 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-lg"
        >
            {/* Average Rating */}
            <div className="text-center mb-6 pb-6 border-b-2 border-yellow-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-900">Đánh giá trung bình</h3>
                </div>

                <div className="text-6xl font-bold text-yellow-600 mb-2">
                    {totalWithRating > 0 ? averageRating.toFixed(1) : "0.0"}
                </div>

                <div className="flex justify-center mb-2">
                    <StarRating value={averageRating} size="lg" />
                </div>

                <p className="text-sm text-gray-600">
                    {totalWithRating > 0 ? (
                        <>
                            <span className="font-semibold">{totalWithRating}</span> đánh giá
                            {totalReviews > totalWithRating && (
                                <> • <span className="font-semibold">{totalReviews - totalWithRating}</span> nhận xét</>
                            )}
                        </>
                    ) : (
                        "Chưa có đánh giá"
                    )}
                </p>
            </div>

            {/* Rating Distribution */}
            {totalWithRating > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Phân bố đánh giá</h4>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingDistribution[star as keyof typeof ratingDistribution];
                        const percentage = getPercentage(count);

                        return (
                            <div key={star} className="flex items-center gap-2">
                                <div className="flex items-center gap-1 w-12">
                                    <span className="text-sm font-medium text-gray-700">{star}</span>
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                </div>

                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
                                        className={`h-full ${star === 5 ? "bg-yellow-400" :
                                                star === 4 ? "bg-green-400" :
                                                    star === 3 ? "bg-blue-400" :
                                                        star === 2 ? "bg-orange-400" :
                                                            "bg-red-400"
                                            }`}
                                    />
                                </div>

                                <div className="w-12 text-right">
                                    <span className="text-xs text-gray-600 font-medium">
                                        {percentage}%
                                    </span>
                                </div>

                                <div className="w-8 text-right">
                                    <span className="text-xs text-gray-500">
                                        ({count})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
