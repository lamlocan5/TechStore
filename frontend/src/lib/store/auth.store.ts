import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/lib/api/auth.service";
import type { User, LoginRequest, RegisterRequest, Role } from "@/types";
import { toast } from "sonner";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasHydrated: boolean; // Track if store has been hydrated from localStorage

    // Actions
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    setHasHydrated: (state: boolean) => void;
}

// Helper function to convert role strings to Role objects
function mapRolesToObjects(roleNames: string[]): Role[] {
    return roleNames.map(name => ({
        name,
        description: getRoleDescription(name),
        permissions: []
    }));
}

function getRoleDescription(roleName: string): string {
    const descriptions: Record<string, string> = {
        'USER': 'Người dùng',
        'ADMIN': 'Quản trị viên',
        'MANAGER': 'Quản lý',
        'STAFF': 'Nhân viên'
    };
    return descriptions[roleName] || roleName;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            hasHydrated: false,

            setHasHydrated: (state: boolean) => {
                set({ hasHydrated: state });
            },

            login: async (credentials: LoginRequest) => {
                try {
                    set({ isLoading: true });
                    const authResponse = await authService.login(credentials);

                    // Store tokens
                    localStorage.setItem("access_token", authResponse.token);
                    localStorage.setItem("refresh_token", authResponse.token);

                    // Create user object from auth response with mapped roles
                    const user: User = {
                        id: authResponse.userId,
                        username: authResponse.username,
                        firstName: authResponse.firstName,
                        lastName: authResponse.lastName,
                        dob: "",
                        roles: mapRolesToObjects(authResponse.roles),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    toast.success("Đăng nhập thành công!");
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Đăng nhập thất bại";
                    toast.error(message);
                    throw error;
                }
            },

            register: async (data: RegisterRequest) => {
                try {
                    set({ isLoading: true });
                    const user = await authService.register(data);

                    set({ isLoading: false });
                    toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
                } catch (error: any) {
                    set({ isLoading: false });
                    const message = error.response?.data?.message || "Đăng ký thất bại";
                    toast.error(message);
                    throw error;
                }
            },

            logout: async () => {
                try {
                    const token = localStorage.getItem("access_token");
                    if (token) {
                        await authService.logout(token);
                    }
                } catch (error) {
                    console.error("Logout error:", error);
                } finally {
                    // Clear tokens and state
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");

                    // Clear cart and wishlist data from localStorage
                    localStorage.removeItem("cart-storage");
                    localStorage.removeItem("wishlist-storage");

                    set({
                        user: null,
                        isAuthenticated: false
                    });

                    // Force reload to clear all stores from memory
                    window.location.href = "/";
                }
            },

            loadUser: async () => {
                try {
                    const token = localStorage.getItem("access_token");
                    if (!token) {
                        set({ isAuthenticated: false, user: null });
                        return;
                    }

                    set({ isLoading: true });

                    // Get user data from identity service (includes roles)
                    const identityData = await authService.getMyInfo();

                    // Try to get profile data from profile service
                    try {
                        const profileService = await import("@/lib/api/profile.service");
                        const profileData = await profileService.getProfileByUserId(identityData.id);

                        // Merge identity and profile data, preserving rank and totalSpent from identity
                        const mergedUser: User = {
                            ...identityData,
                            firstName: profileData.firstName,
                            lastName: profileData.lastName,
                            dob: profileData.dob,
                            // Ensure rank and totalSpent from identity are preserved
                            rank: identityData.rank,
                            totalSpent: identityData.totalSpent,
                            // Add email, phone, and avatar from profile if available
                            ...(profileData.email && { email: profileData.email }),
                            ...(profileData.phone && { phone: profileData.phone }),
                            ...(profileData.avatar && { avatar: profileData.avatar }),
                        };

                        set({
                            user: mergedUser,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    } catch (profileError) {
                        // If profile service fails, just use identity data
                        console.warn("Profile service unavailable, using identity data only:", profileError);
                        set({
                            user: identityData,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error("Load user error:", error);
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                    });
                }
            },

            updateUser: (data: Partial<User>) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: { ...currentUser, ...data }
                    });
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                // Called when store is rehydrated from localStorage
                state?.setHasHydrated(true);
            },
        }
    )
);
