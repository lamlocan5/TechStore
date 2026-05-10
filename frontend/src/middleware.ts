import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/orders", "/checkout"];

// Auth routes that should redirect to home if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if route is auth route
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // For protected routes, we can't check localStorage in middleware
    // So we'll let the page component handle the redirect
    // This is a limitation of Next.js middleware (server-side)

    // Only handle auth routes redirect (if user is already logged in)
    // We can't reliably check this in middleware with localStorage
    // So we'll remove this check and let client-side handle it

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
