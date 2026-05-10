import apiClient from "./client";
import type {
    ApiResponse,
    PaginatedResponse,
    Product,
    Brand,
    Category,
    ProductVariant,
    SpecAttribute,
    VariantSpec
} from "@/types";

// Products
export async function getAllProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
        "/product/products",
        { params }
    );
    return response.data.result;
}

export async function getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/product/products/${id}`);
    return response.data.result;
}

export async function searchProducts(params: {
    name: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
        "/product/products/search",
        { params }
    );
    return response.data.result;
}

// Advanced Search with Filters
export interface ProductSearchParams {
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    brandId?: number;
    categoryId?: number;
    page?: number;
    limit?: number;
}

export async function searchProductsAdvanced(
    params: ProductSearchParams
): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();

    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.brandId) queryParams.append('brandId', params.brandId.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
        `/product/products/search/advanced?${queryParams.toString()}`
    );
    return response.data.result;
}

export async function getProductsByBrand(params: {
    brandId: number;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Product>> {
    const { brandId, page, limit } = params;
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
        `/product/products/brand/${brandId}`,
        { params: { page, limit } }
    );
    return response.data.result;
}

// Brands
export async function getAllBrands(params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Brand>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Brand>>>(
        "/product/brands",
        { params }
    );
    return response.data.result;
}

export async function searchBrands(params: {
    name: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Brand>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Brand>>>(
        "/product/brands/search",
        { params }
    );
    return response.data.result;
}

export async function getBrandById(id: number): Promise<Brand> {
    const response = await apiClient.get<ApiResponse<Brand>>(`/product/brands/${id}`);
    return response.data.result;
}

// Categories
export async function getAllCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<PaginatedResponse<Category>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Category>>>(
        "/product/categories",
        { params }
    );
    return response.data.result;
}

export async function searchCategories(params: {
    name: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Category>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Category>>>(
        "/product/categories/search",
        { params }
    );
    return response.data.result;
}

// Product Variants
export async function getVariantsByProduct(productId: number): Promise<ProductVariant[]> {
    const response = await apiClient.get<ApiResponse<ProductVariant[]>>(
        `/product/variants/product/${productId}`
    );
    return response.data.result;
}

export async function searchVariantsBySku(params: {
    sku: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<ProductVariant>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProductVariant>>>(
        "/product/variants/search",
        { params }
    );
    return response.data.result;
}

// Spec Attributes
export async function getAllSpecAttributes(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<PaginatedResponse<SpecAttribute>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<SpecAttribute>>>(
        "/product/spec-attributes",
        { params }
    );
    return response.data.result;
}

// Variant Specs
export async function getVariantSpecs(variantId: number): Promise<VariantSpec[]> {
    const response = await apiClient.get<ApiResponse<VariantSpec[]>>(
        `/product/variant-specs/variant/${variantId}`
    );
    return response.data.result;
}
