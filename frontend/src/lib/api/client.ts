import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/constants";

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds
});

// Request interceptor - attach token to requests
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh on 401
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip auto-logout for certain endpoints where 401 is expected
        const skipAutoLogoutPaths = [
            '/change-password',  // Wrong old password returns 401
            '/auth/token',       // Wrong credentials returns 401
        ];

        const shouldSkipAutoLogout = skipAutoLogoutPaths.some(path =>
            originalRequest.url?.includes(path)
        );

        // If error is 401 and we haven't retried yet, and it's not a skip path
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipAutoLogout) {
            originalRequest._retry = true;

            try {
                // Get refresh token
                const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

                if (refreshToken) {
                    // Try to refresh the token
                    const response = await axios.post(`${API_BASE_URL}/identity/auth/refresh`, {
                        token: refreshToken,
                    });

                    const { token } = response.data.result;

                    // Save new token
                    if (typeof window !== "undefined") {
                        localStorage.setItem("access_token", token);
                    }

                    // Retry original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                if (typeof window !== "undefined") {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
