import axios from "axios";
import { ImageSearchResponse, ImageSearchResult } from "@/types/image-search";

// Gateway URL for image search (different from main API)
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8888";

/**
 * Search products by image
 * @param file - Image file to search with
 * @param topK - Number of results to return (default: 10)
 * @returns Promise<ImageSearchResult[]>
 */
export async function searchByImage(
    file: File,
    topK: number = 10
): Promise<ImageSearchResult[]> {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
        throw new Error("Định dạng file không hỗ trợ. Vui lòng sử dụng JPEG, PNG, WebP hoặc GIF.");
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error("File quá lớn. Kích thước tối đa là 5MB.");
    }

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axios.post<ImageSearchResponse>(
            `${GATEWAY_URL}/api/v1/search/image`,
            formData,
            {
                params: { topK },
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 60000, // 60 seconds for image processing
            }
        );

        if (response.data.code === 1000 && response.data.result) {
            return response.data.result;
        }

        throw new Error(response.data.message || "Tìm kiếm thất bại");
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.code === "ECONNABORTED") {
                throw new Error("Tìm kiếm quá thời gian. Vui lòng thử lại.");
            }
            if (error.response?.status === 400) {
                throw new Error(error.response.data?.message || "File không hợp lệ.");
            }
            if (error.response?.status === 500) {
                throw new Error("Lỗi server. Vui lòng thử lại sau.");
            }
            throw new Error(error.response?.data?.message || "Tìm kiếm thất bại.");
        }
        throw error;
    }
}

/**
 * Check if image search service is available
 */
export async function checkImageSearchHealth(): Promise<boolean> {
    try {
        const response = await axios.get(`${GATEWAY_URL}/api/v1/image-search/health`, {
            timeout: 5000,
        });
        return response.data.code === 1000;
    } catch {
        return false;
    }
}
