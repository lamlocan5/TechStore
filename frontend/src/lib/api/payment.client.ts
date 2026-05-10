import axios from "axios";

const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://localhost:8888/api/v1/payment";

// Payment API Client (Port 8085)
export const paymentClient = axios.create({
    baseURL: PAYMENT_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for payment client
paymentClient.interceptors.request.use(
    (config) => {
        // Add auth token if needed
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for payment client
paymentClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
