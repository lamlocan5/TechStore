"use client";

import { useState, useCallback } from "react";
import { ImageSearchResult } from "@/types/image-search";
import { searchByImage } from "@/lib/api/image-search.service";

interface UseImageSearchReturn {
    // State
    isLoading: boolean;
    error: string | null;
    results: ImageSearchResult[];
    previewUrl: string | null;
    selectedFile: File | null;

    // Actions
    selectFile: (file: File) => void;
    clearFile: () => void;
    search: () => Promise<void>;
    reset: () => void;
}

export function useImageSearch(topK: number = 10): UseImageSearchReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ImageSearchResult[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const selectFile = useCallback((file: File) => {
        // Revoke previous preview URL to prevent memory leaks
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
        setResults([]);
    }, [previewUrl]);

    const clearFile = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setResults([]);
    }, [previewUrl]);

    const search = useCallback(async () => {
        if (!selectedFile) {
            setError("Vui lòng chọn một hình ảnh để tìm kiếm.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const searchResults = await searchByImage(selectedFile, topK);
            setResults(searchResults);

            if (searchResults.length === 0) {
                setError("Không tìm thấy sản phẩm tương tự.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tìm kiếm thất bại.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile, topK]);

    const reset = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setIsLoading(false);
        setError(null);
        setResults([]);
        setPreviewUrl(null);
        setSelectedFile(null);
    }, [previewUrl]);

    return {
        isLoading,
        error,
        results,
        previewUrl,
        selectedFile,
        selectFile,
        clearFile,
        search,
        reset,
    };
}
