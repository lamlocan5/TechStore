"use client";

import { ReactNode } from "react";

interface CheckoutLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
}

export function CheckoutLayout({ children, sidebar }: CheckoutLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left 2/3 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {children}
                        </div>
                    </div>

                    {/* Sidebar - Right 1/3 */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4">
                            {sidebar}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
