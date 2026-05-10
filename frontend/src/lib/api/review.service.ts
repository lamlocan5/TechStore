import { apiClient } from "./client";
import type { Review, CreateReviewRequest, ReviewsResponse, ApiResponse } from "@/types/review";

/**
 * Review & Rating Service
 * Handles product reviews and ratings
 */

// Create a new review or comment
export const createReview = async (data: CreateReviewRequest): Promise<Review> => {
    const response = await apiClient.post<ApiResponse<Review>>("/product/reviews", data);
    return response.data.result;
};

// Get reviews for a product with pagination
export const getReviewsByProductId = async (
    productId: number,
    page: number = 1,
    limit: number = 20
): Promise<ReviewsResponse> => {
    const response = await apiClient.get<ApiResponse<ReviewsResponse>>(
        `/product/reviews/product/${productId}`,
        { params: { page, limit } }
    );
    return response.data.result;
};

// Get all reviews for a product (no pagination)
export const getAllReviewsByProductId = async (productId: number): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>(
        `/product/reviews/product/${productId}/all`
    );
    return response.data.result;
};

// Calculate review statistics from reviews array
export const calculateReviewStats = (reviews: Review[]) => {
    const reviewsWithRating = reviews.filter(r => r.rating !== null);

    const stats = {
        averageRating: 0,
        totalReviews: reviews.length,
        totalWithRating: reviewsWithRating.length,
        ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        },
    };

    if (reviewsWithRating.length === 0) return stats;

    // Calculate distribution
    reviewsWithRating.forEach(review => {
        if (review.rating) {
            stats.ratingDistribution[review.rating as keyof typeof stats.ratingDistribution]++;
        }
    });

    // Calculate average
    const sum = reviewsWithRating.reduce((acc, review) => acc + (review.rating || 0), 0);
    stats.averageRating = sum / reviewsWithRating.length;

    return stats;
};
