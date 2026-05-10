/**
 * Generates SEO-friendly slug with ID embedded
 * Format: {slug}-{id}
 * Example: laptop-dell-xps-13-123
 */
export function generateProductSlug(slug: string, id: number | string): string {
    return `${slug}-${id}`;
}

/**
 * Extracts product ID from slug
 * Format: {slug}-{id}
 * Example: laptop-dell-xps-13-123 → 123
 */
export function extractIdFromSlug(slugWithId: string): number {
    const parts = slugWithId.split('-');
    const id = parts[parts.length - 1];
    return parseInt(id, 10);
}
