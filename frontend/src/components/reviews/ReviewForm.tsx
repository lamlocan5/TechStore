"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Star as StarIcon } from "lucide-react";
import { createReview } from "@/lib/api/review.service";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/auth.store";

interface ReviewFormProps {
    productId: number;
    hasPurchased: boolean;
    onSuccess?: () => void;
}

export function ReviewForm({ productId, hasPurchased, onSuccess }: ReviewFormProps) {
    const { isAuthenticated } = useAuthStore();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để đánh giá");
            return;
        }

        if (!rating && !comment.trim()) {
            toast.error("Vui lòng nhập đánh giá hoặc nhận xét");
            return;
        }

        try {
            setIsSubmitting(true);

            await createReview({
                productId,
                ...(rating > 0 && { rating }),
                ...(comment.trim() && { comment: comment.trim() }),
            });

            toast.success(rating > 0 ? "Đánh giá thành công!" : "Nhận xét thành công!");

            // Reset form
            setRating(0);
            setComment("");

            // Callback
            onSuccess?.();
        } catch (error: any) {
            const errorCode = error.response?.data?.code;
            const errorMessage = error.response?.data?.message;

            if (errorCode === 2010) {
                toast.error("Bạn chưa mua sản phẩm này nên không thể đánh giá");
            } else if (errorCode === 2013) {
                toast.error("Bạn đã đánh giá sản phẩm này rồi");
            } else {
                toast.error(errorMessage || "Có lỗi xảy ra, vui lòng thử lại");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 text-center"
            >
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Đăng nhập để đánh giá sản phẩm</p>
                <Button
                    onClick={() => window.location.href = "/login"}
                    className="bg-gradient-to-r from-primary to-blue-600"
                >
                    Đăng nhập ngay
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-100"
        >
            <div className="flex items-center gap-2 mb-4">
                <StarIcon className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-gray-900">
                    {hasPurchased ? "Đánh giá sản phẩm" : "Nhận xét sản phẩm"}
                </h3>
            </div>

            {/* Star Rating (only if purchased) */}
            {hasPurchased && (
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Đánh giá của bạn
                    </label>
                    <StarRating
                        value={rating}
                        onChange={setRating}
                        size="lg"
                        interactive
                    />
                    {rating > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {rating === 5 && "Xuất sắc! ⭐"}
                            {rating === 4 && "Rất tốt! 👍"}
                            {rating === 3 && "Tốt 👌"}
                            {rating === 2 && "Tạm được 😐"}
                            {rating === 1 && "Không hài lòng 😞"}
                        </p>
                    )}
                </div>
            )}

            {!hasPurchased && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        💡 Bạn chưa mua sản phẩm này nên chỉ có thể để lại nhận xét
                    </p>
                </div>
            )}

            {/* Comment */}
            <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Nhận xét {!hasPurchased && "(bắt buộc)"}
                </label>
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={hasPurchased
                        ? "Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        : "Bạn nghĩ gì về sản phẩm này?"
                    }
                    className="min-h-[100px] resize-none border-2 border-gray-200 focus:border-primary rounded-xl"
                    maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                        {comment.length}/500 ký tự
                    </p>
                    {!hasPurchased && !comment.trim() && (
                        <p className="text-xs text-red-500">
                            * Bắt buộc nhập nhận xét
                        </p>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isSubmitting || (!hasPurchased && !comment.trim())}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 h-11"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang gửi...
                    </>
                ) : (
                    <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {hasPurchased ? "Gửi đánh giá" : "Gửi nhận xét"}
                    </>
                )}
            </Button>
        </motion.form>
    );
}
