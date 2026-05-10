// Product Service Types
export interface Product {
    id: number;
    categoryIds: number[];
    brandId: number;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    priceList: number;
    priceSale: number;
    avatar: string;
    images: string; // Comma-separated URLs
    status: boolean;
    firstImage: string;
    createdAt: string;
    updatedAt: string;
    variants?: Variant[];
    // Populated fields (not from API but useful for UI)
    brand?: Brand;
    categories?: Category[];
    brandName?: string;
    categoryNames?: string[];
    minPrice?: number | null;
    maxPrice?: number | null;
    totalStock?: number;
    variantCount?: number;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string;
    logo: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Variant {
    id: number;
    productId: number;
    sku: string;
    price?: number;
    priceList?: number;
    priceSale?: number;
    stock: number;
    color?: string;
    size?: string;
    image?: string;
    ramGb?: number;
    storageGb?: number;
    cpuModel?: string;
    gpuModel?: string;
    igpu?: string;
    os?: string;
    createdAt: string;
    updatedAt: string;
    specs?: VariantSpec[];
}

export interface SpecAttribute {
    id: number;
    label: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export interface VariantSpec {
    id: string;
    variantId: number;
    specAttributeId: number;
    value: string;
    createdAt: string;
    // Populated
    attribute?: SpecAttribute;
}

// Query parameters
export interface ProductQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface SearchQueryParams extends ProductQueryParams {
    name: string;
}

// Wishlist
export interface WishlistItem {
    id: string;
    userId: string;
    productId: number;
    product?: Product;
    createdAt: string;
}
