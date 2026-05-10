"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "@/lib/api/product.service";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/lib/store/filter.store";
import {
    PRICE_RANGES,
    CPU_OPTIONS,
    RAM_OPTIONS,
    STORAGE_OPTIONS,
    SCREEN_SIZE_OPTIONS,
    GPU_OPTIONS,
} from "@/types/filters";
import { useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";

export function FilterSidebar() {
    const {
        selectedBrand,
        priceRange,
        setSelectedBrand,
        setPriceRange,
        clearFilters,
        hasActiveFilters,
        getActiveFilterCount,
    } = useFilterStore();

    const [customPriceMin, setCustomPriceMin] = useState(priceRange.min);
    const [customPriceMax, setCustomPriceMax] = useState(priceRange.max);

    // Fetch brands
    const { data: brandsData } = useQuery({
        queryKey: ["brands"],
        queryFn: () => getAllBrands({ page: 1, limit: 100 }),
        staleTime: 5 * 60 * 1000, // 5 minutes - brands rarely change
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " đ";
    };

    const handlePriceRangeClick = (min: number, max: number) => {
        setPriceRange(min, max);
        setCustomPriceMin(min);
        setCustomPriceMax(max);
    };

    const handleCustomPriceChange = () => {
        setPriceRange(customPriceMin, customPriceMax);
    };

    const activeCount = getActiveFilterCount();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg border border-gray-200 p-3 space-y-3"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        🔍 Bộ lọc
                    </h2>
                    {activeCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-primary-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                        >
                            {activeCount}
                        </motion.span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                        Xóa tất cả
                    </button>
                )}
            </div>

            <Accordion type="multiple" defaultValue={["price", "brand"]} className="w-full">
                {/* Price Range Filter */}
                <AccordionItem value="price" className="border-none">
                    <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                        <span className="flex items-center gap-2">
                            💰 Khoảng giá
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {PRICE_RANGES.map((range, index) => (
                                <motion.button
                                    key={range.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handlePriceRangeClick(range.min, range.max)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${priceRange.min === range.min && priceRange.max === range.max
                                        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                        }`}
                                >
                                    {range.label}
                                </motion.button>
                            ))}

                            {/* Custom Price Range */}
                            <div className="pt-3 mt-3 border-t">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Tùy chỉnh:</p>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={customPriceMin}
                                        onChange={(e) => setCustomPriceMin(Number(e.target.value))}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Từ"
                                    />
                                    <span className="text-sm text-gray-400">-</span>
                                    <input
                                        type="number"
                                        value={customPriceMax}
                                        onChange={(e) => setCustomPriceMax(Number(e.target.value))}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Đến"
                                    />
                                </div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        size="sm"
                                        className="w-full mt-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                                        onClick={handleCustomPriceChange}
                                    >
                                        Áp dụng
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Brand Filter - Single Select */}
                <AccordionItem value="brand" className="border-none">
                    <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                        <span className="flex items-center gap-2">
                            🏷️ Thương hiệu
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto pt-2 pr-2">
                            {/* All Brands Option */}
                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => setSelectedBrand(null)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedBrand === null
                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                                    : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                    }`}
                            >
                                Tất cả thương hiệu
                            </motion.button>

                            {brandsData?.result.map((brand, index) => (
                                <motion.button
                                    key={brand.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ x: 4 }}
                                    onClick={() => setSelectedBrand(brand.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedBrand === brand.id
                                        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md"
                                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                                        }`}
                                >
                                    {brand.name}
                                </motion.button>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </motion.div>
    );
}
