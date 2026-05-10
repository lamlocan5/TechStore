"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    searchParams?: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
    const [jumpPage, setJumpPage] = useState("");

    if (totalPages <= 1) return null;

    const buildUrl = (page: number) => {
        const params = new URLSearchParams({ ...searchParams, page: page.toString() });
        return `${baseUrl}?${params.toString()}`;
    };

    const handleJumpPage = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(jumpPage);
        if (page >= 1 && page <= totalPages) {
            window.location.href = buildUrl(page);
        }
    };

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 3; // Show 3 pages on each side

        if (totalPages <= 7) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > showPages + 1) {
                pages.push("...");
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - showPages) {
                pages.push("...");
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            {/* Previous Button */}
            <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={buildUrl(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronLeft className="h-4 w-4" />
                    </span>
                )}
            </Button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, idx) => {
                if (page === "...") {
                    return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                            ...
                        </span>
                    );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                    <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={isActive ? "pointer-events-none" : ""}
                        asChild={!isActive}
                    >
                        {isActive ? (
                            <span>{pageNum}</span>
                        ) : (
                            <Link href={buildUrl(pageNum)}>{pageNum}</Link>
                        )}
                    </Button>
                );
            })}

            {/* Next Button */}
            <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={buildUrl(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronRight className="h-4 w-4" />
                    </span>
                )}
            </Button>

            {/* Jump to Page */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-600">Đến trang:</span>
                <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    className="w-16 h-8 text-center"
                    placeholder={currentPage.toString()}
                />
                <Button type="submit" size="sm" variant="outline">
                    Đi
                </Button>
            </form>
        </div>
    );
}
