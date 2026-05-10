"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";

interface UseAuthGuardOptions {
    redirectTo?: string;
    requireAuth?: boolean;
}

/**
 * Hook to guard routes that require authentication.
 * Waits for Zustand hydration before checking auth state to prevent
 * premature redirects on page refresh.
 * 
 * @returns {object} { isLoading, isAuthenticated, user }
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
    const { redirectTo = "/login", requireAuth = true } = options;
    const router = useRouter();
    const { user, isAuthenticated, loadUser, hasHydrated, isLoading } = useAuthStore();

    // Load user data after hydration
    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            loadUser();
        }
    }, [hasHydrated, isAuthenticated, loadUser]);

    // Redirect if not authenticated (only after hydration)
    useEffect(() => {
        if (hasHydrated && requireAuth && !isAuthenticated) {
            const currentPath = window.location.pathname;
            router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [hasHydrated, isAuthenticated, requireAuth, router, redirectTo]);

    return {
        isLoading: !hasHydrated || isLoading,
        isAuthenticated,
        user,
        hasHydrated,
    };
}

/**
 * Hook for pages that should redirect authenticated users away (e.g., login page)
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/") {
    const router = useRouter();
    const { isAuthenticated, hasHydrated } = useAuthStore();

    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            router.push(redirectTo);
        }
    }, [hasHydrated, isAuthenticated, router, redirectTo]);

    return {
        isLoading: !hasHydrated,
        isAuthenticated,
        hasHydrated,
    };
}
