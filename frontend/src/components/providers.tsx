"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
                        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (formerly cacheTime)
                        refetchOnWindowFocus: false, // Don't refetch when window regains focus
                        refetchOnMount: false, // Don't refetch on component mount if data exists
                        retry: 1, // Only retry once on failure
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" richColors />
        </QueryClientProvider>
    );
}
