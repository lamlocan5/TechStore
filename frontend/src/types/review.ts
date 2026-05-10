// Review & Rating Types
export interface Review {
    id: number;
    productId: number;
    userId: string;
    rating: number | null;  // null if user hasn't purchased
    comment: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReviewRequest {
    productId: number;
    rating?: number;  // 1-5, optional
    comment?: string;
}

export interface ReviewsResponse {
    result: Review[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    totalWithRating: number;  // Only reviews with rating (purchased users)
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

// API Response wrapper
export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
}
