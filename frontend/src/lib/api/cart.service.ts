import apiClient from "./client";
import type {
    ApiResponse,
    Cart,
    AddToCartRequest,
    UpdateCartItemRequest
} from "@/types";

// Get my cart
export async function getMyCart(): Promise<Cart> {
    const response = await apiClient.get<ApiResponse<Cart>>("/cart");
    return response.data.result;
}

// Add item to cart
export async function addToCart(data: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>(
        "/cart/items",
        data
    );
    return response.data.result;
}

// Update cart item quantity
export async function updateCartItem(
    itemId: number,
    data: UpdateCartItemRequest
): Promise<Cart> {
    const response = await apiClient.put<ApiResponse<Cart>>(
        `/cart/items/${itemId}`,
        data
    );
    return response.data.result;
}

// Remove item from cart
export async function removeFromCart(itemId: number): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>(
        `/cart/items/${itemId}`
    );
    return response.data.result;
}

// Clear cart
export async function clearCart(): Promise<void> {
    await apiClient.delete("/cart/clear");
}
