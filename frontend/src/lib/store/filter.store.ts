import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterState, SortOption } from "@/types/filters";

interface FilterStore extends FilterState {
    sortBy: SortOption;
    selectedBrand: number | null; // Single brand selection for advanced search

    // Actions
    setCategories: (categories: number[]) => void;
    setBrands: (brands: number[]) => void; // Keep for backward compatibility
    setSelectedBrand: (brandId: number | null) => void; // New: single brand
    setPriceRange: (min: number, max: number) => void;
    setCpu: (cpu: string[]) => void;
    setRam: (ram: string[]) => void;
    setStorage: (storage: string[]) => void;
    setScreenSize: (screenSize: string[]) => void;
    setGpu: (gpu: string[]) => void;
    setSortBy: (sortBy: SortOption) => void;

    // Toggle actions
    toggleCategory: (categoryId: number) => void;
    toggleBrand: (brandId: number) => void;
    toggleCpu: (cpu: string) => void;
    toggleRam: (ram: string) => void;
    toggleStorage: (storage: string) => void;
    toggleScreenSize: (size: string) => void;
    toggleGpu: (gpu: string) => void;

    // Clear actions
    clearFilters: () => void;
    clearPriceRange: () => void;

    // Helpers
    hasActiveFilters: () => boolean;
    getActiveFilterCount: () => number;
}

const initialState: FilterState = {
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 999999999 },
    cpu: [],
    ram: [],
    storage: [],
    screenSize: [],
    gpu: [],
};

export const useFilterStore = create<FilterStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            sortBy: "newest",
            selectedBrand: null,

            setCategories: (categories) => set({ categories }),
            setBrands: (brands) => set({ brands }),
            setSelectedBrand: (brandId) => set({ selectedBrand: brandId }),
            setPriceRange: (min, max) => set({ priceRange: { min, max } }),
            setCpu: (cpu) => set({ cpu }),
            setRam: (ram) => set({ ram }),
            setStorage: (storage) => set({ storage }),
            setScreenSize: (screenSize) => set({ screenSize }),
            setGpu: (gpu) => set({ gpu }),
            setSortBy: (sortBy) => set({ sortBy }),

            toggleCategory: (categoryId) => {
                const { categories } = get();
                set({
                    categories: categories.includes(categoryId)
                        ? categories.filter((id) => id !== categoryId)
                        : [...categories, categoryId],
                });
            },

            toggleBrand: (brandId) => {
                const { brands } = get();
                set({
                    brands: brands.includes(brandId)
                        ? brands.filter((id) => id !== brandId)
                        : [...brands, brandId],
                });
            },

            toggleCpu: (cpu) => {
                const { cpu: cpuList } = get();
                set({
                    cpu: cpuList.includes(cpu)
                        ? cpuList.filter((c) => c !== cpu)
                        : [...cpuList, cpu],
                });
            },

            toggleRam: (ram) => {
                const { ram: ramList } = get();
                set({
                    ram: ramList.includes(ram)
                        ? ramList.filter((r) => r !== ram)
                        : [...ramList, ram],
                });
            },

            toggleStorage: (storage) => {
                const { storage: storageList } = get();
                set({
                    storage: storageList.includes(storage)
                        ? storageList.filter((s) => s !== storage)
                        : [...storageList, storage],
                });
            },

            toggleScreenSize: (size) => {
                const { screenSize } = get();
                set({
                    screenSize: screenSize.includes(size)
                        ? screenSize.filter((s) => s !== size)
                        : [...screenSize, size],
                });
            },

            toggleGpu: (gpu) => {
                const { gpu: gpuList } = get();
                set({
                    gpu: gpuList.includes(gpu)
                        ? gpuList.filter((g) => g !== gpu)
                        : [...gpuList, gpu],
                });
            },

            clearFilters: () => set({ ...initialState, sortBy: get().sortBy }),

            clearPriceRange: () => set({ priceRange: { min: 0, max: 999999999 } }),

            hasActiveFilters: () => {
                const state = get();
                return (
                    state.categories.length > 0 ||
                    state.brands.length > 0 ||
                    state.priceRange.min > 0 ||
                    state.priceRange.max < 999999999 ||
                    state.cpu.length > 0 ||
                    state.ram.length > 0 ||
                    state.storage.length > 0 ||
                    state.screenSize.length > 0 ||
                    state.gpu.length > 0
                );
            },

            getActiveFilterCount: () => {
                const state = get();
                let count = 0;
                if (state.categories.length > 0) count += state.categories.length;
                if (state.brands.length > 0) count += state.brands.length;
                if (state.priceRange.min > 0 || state.priceRange.max < 999999999) count += 1;
                if (state.cpu.length > 0) count += state.cpu.length;
                if (state.ram.length > 0) count += state.ram.length;
                if (state.storage.length > 0) count += state.storage.length;
                if (state.screenSize.length > 0) count += state.screenSize.length;
                if (state.gpu.length > 0) count += state.gpu.length;
                return count;
            },
        }),
        {
            name: "filter-storage",
        }
    )
);
