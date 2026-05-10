"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/lib/store/filter.store";
import { PRICE_RANGES } from "@/types/filters";

export function ActiveFilters() {
    const {
        categories,
        brands,
        priceRange,
        cpu,
        ram,
        storage,
        screenSize,
        gpu,
        clearFilters,
        toggleCategory,
        toggleBrand,
        toggleCpu,
        toggleRam,
        toggleStorage,
        toggleScreenSize,
        toggleGpu,
        clearPriceRange,
        getActiveFilterCount,
    } = useFilterStore();

    const activeCount = getActiveFilterCount();

    if (activeCount === 0) return null;

    const formatPrice = (price: number) => {
        return (price / 1000000).toFixed(0) + " triệu";
    };

    const getPriceRangeLabel = () => {
        const range = PRICE_RANGES.find(
            (r) => r.min === priceRange.min && r.max === priceRange.max
        );
        return range?.label || `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
    };

    return (
        <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                    Bộ lọc đang áp dụng ({activeCount})
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary hover:text-primary/80"
                >
                    Xóa tất cả
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Price Range */}
                {(priceRange.min > 0 || priceRange.max < 999999999) && (
                    <Badge variant="secondary" className="gap-1">
                        {getPriceRangeLabel()}
                        <button onClick={clearPriceRange} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}

                {/* CPU Filters */}
                {cpu.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1">
                        {c}
                        <button onClick={() => toggleCpu(c)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                {/* RAM Filters */}
                {ram.map((r) => (
                    <Badge key={r} variant="secondary" className="gap-1">
                        RAM {r}
                        <button onClick={() => toggleRam(r)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                {/* Storage Filters */}
                {storage.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                        SSD {s}
                        <button onClick={() => toggleStorage(s)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                {/* Screen Size Filters */}
                {screenSize.map((size) => (
                    <Badge key={size} variant="secondary" className="gap-1">
                        Màn hình {size}
                        <button onClick={() => toggleScreenSize(size)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                {/* GPU Filters */}
                {gpu.map((g) => (
                    <Badge key={g} variant="secondary" className="gap-1">
                        {g}
                        <button onClick={() => toggleGpu(g)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
}
