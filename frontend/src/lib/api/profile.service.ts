import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface UserProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    dob: string;
    email?: string;
    phone?: string;
    avatar?: string;
    status: number;
}

// Get profile by user ID
export async function getProfileByUserId(userId: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(
        `/profile/users/${userId}`
    );
    return response.data;
}

// Get all profiles (admin)
export async function getAllProfiles(params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserProfile>>>(
        "/profile/users",
        { params }
    );
    return response.data.result;
}

// Update profile (internal - called after identity service update)
export async function updateProfile(
    userId: string,
    data: Partial<Omit<UserProfile, "id" | "userId">>
): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>(
        `/profile/users/${userId}`,
        data
    );
    return response.data;
}
