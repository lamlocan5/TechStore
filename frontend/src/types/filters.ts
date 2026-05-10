// Filter types
export interface FilterState {
    categories: number[];
    brands: number[];
    priceRange: {
        min: number;
        max: number;
    };
    cpu: string[];
    ram: string[];
    storage: string[];
    screenSize: string[];
    gpu: string[];
}

export interface PriceRangeOption {
    label: string;
    min: number;
    max: number;
}

export const PRICE_RANGES: PriceRangeOption[] = [
    { label: "Dưới 10 triệu", min: 0, max: 10000000 },
    { label: "10 - 15 triệu", min: 10000000, max: 15000000 },
    { label: "15 - 20 triệu", min: 15000000, max: 20000000 },
    { label: "20 - 25 triệu", min: 20000000, max: 25000000 },
    { label: "25 - 30 triệu", min: 25000000, max: 30000000 },
    { label: "Trên 30 triệu", min: 30000000, max: 999999999 },
];

export const CPU_OPTIONS = [
    "Intel Core i3",
    "Intel Core i5",
    "Intel Core i7",
    "Intel Core i9",
    "AMD Ryzen 3",
    "AMD Ryzen 5",
    "AMD Ryzen 7",
    "AMD Ryzen 9",
    "Apple M1",
    "Apple M2",
    "Apple M3",
];

export const RAM_OPTIONS = [
    "4GB",
    "8GB",
    "16GB",
    "24GB",
    "32GB",
    "64GB+",
];

export const STORAGE_OPTIONS = [
    "128GB",
    "256GB",
    "512GB",
    "1TB",
    "2TB+",
];

export const SCREEN_SIZE_OPTIONS = [
    '13"',
    '14"',
    '15"',
    '16"',
    '17"+',
];

export const GPU_OPTIONS = [
    "Integrated",
    "NVIDIA GTX 1650",
    "NVIDIA RTX 3050",
    "NVIDIA RTX 4050",
    "NVIDIA RTX 5050",
    "NVIDIA RTX 3060",
    "NVIDIA RTX 4060",
    "NVIDIA RTX 5060",
    "NVIDIA RTX 4070+",
    "AMD Radeon",
];

export type SortOption =
    | "newest"
    | "price-asc"
    | "price-desc"
    | "best-selling"
    | "discount";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "price-asc", label: "Giá thấp → cao" },
    { value: "price-desc", label: "Giá cao → thấp" },
    { value: "best-selling", label: "Bán chạy" },
    { value: "discount", label: "Khuyến mãi" },
];
