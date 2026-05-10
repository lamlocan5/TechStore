import apiClient from "./client";
import type {
    ApiResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User
} from "@/types";

// Login
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/identity/auth/token",
        credentials
    );
    return response.data.result;
}

// Register
export async function register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
        "/identity/users/createUser",
        data
    );
    return response.data.result;
}

// Logout
export async function logout(token: string): Promise<void> {
    await apiClient.post("/identity/auth/logout", { token });
}

// Refresh token
export async function refreshToken(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/identity/auth/refresh",
        { token }
    );
    return response.data.result;
}

// Introspect token (validate)
export async function introspectToken(token: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(
        "/identity/auth/introspect",
        { token }
    );
    return response.data.result.valid;
}

// Get my info
export async function getMyInfo(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/identity/users/my-info");
    return response.data.result;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/identity/users/${userId}`);
    return response.data.result;
}

// Update user
export async function updateUser(
    userId: string,
    data: Partial<RegisterRequest> & { roles?: string[] }
): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
        `/identity/users/${userId}`,
        data
    );
    return response.data.result;
}

// Change password
export async function changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
        `/identity/users/${userId}/change-password`,
        {
            oldPassword,
            newPassword
        }
    );
    return response.data.result;
}

// Forgot password - sends new password to user's email
export async function forgotPassword(username: string): Promise<void> {
    await apiClient.post("/identity/auth/forgot-password", { username });
}
