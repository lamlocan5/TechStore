import { Product } from "./product";

// Image search result from API
export interface ImageSearchResult {
    product: Product;
    similarity: number;
}

// API response structure
export interface ImageSearchResponse {
    code: number;
    message: string;
    result: ImageSearchResult[];
}

// Image search state
export interface ImageSearchState {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    results: ImageSearchResult[];
    previewUrl: string | null;
    selectedFile: File | null;
}
