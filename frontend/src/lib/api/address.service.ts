import apiClient from "./client";
import type { ApiResponse } from "@/types";
import type { Address, CreateAddressRequest, UpdateAddressRequest } from "@/types/address";

/**
 * Create new address
 */
export async function createAddress(data: CreateAddressRequest): Promise<Address> {
    const response = await apiClient.post<ApiResponse<Address>>("/profile/addresses", data);
    return response.data.result;
}

/**
 * Update existing address
 */
export async function updateAddress(id: number, data: UpdateAddressRequest): Promise<Address> {
    const response = await apiClient.put<ApiResponse<Address>>(`/profile/addresses/${id}`, data);
    return response.data.result;
}

/**
 * Get address by ID
 */
export async function getAddressById(id: number): Promise<Address> {
    const response = await apiClient.get<ApiResponse<Address>>(`/profile/addresses/${id}`);
    return response.data.result;
}

/**
 * Get first address of current user
 */
export async function getMyAddress(): Promise<Address> {
    const response = await apiClient.get<ApiResponse<Address>>("/profile/addresses/my-address");
    return response.data.result;
}

/**
 * Get default address of current user
 */
export async function getMyDefaultAddress(): Promise<Address> {
    const response = await apiClient.get<ApiResponse<Address>>("/profile/addresses/my-address/default");
    return response.data.result;
}

/**
 * Get all addresses of current user
 */
export async function getMyAddresses(): Promise<Address[]> {
    const response = await apiClient.get<ApiResponse<Address[]>>("/profile/addresses/my-addresses");
    return response.data.result;
}

/**
 * Delete address by ID
 */
export async function deleteAddress(id: number): Promise<void> {
    await apiClient.delete(`/profile/addresses/${id}`);
}

/**
 * Delete all addresses of current user
 */
export async function deleteAllMyAddresses(): Promise<void> {
    await apiClient.delete("/profile/addresses/my-addresses");
}

/**
 * Set address as default
 */
export async function setDefaultAddress(id: number): Promise<Address> {
    const response = await apiClient.put<ApiResponse<Address>>(`/profile/addresses/${id}/set-default`);
    return response.data.result;
}
