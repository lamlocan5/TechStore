/**
 * Parse comma-separated product images string into array
 */
export function parseProductImages(images: string): string[] {
    if (!images || images.trim() === '') {
        return [];
    }
    return images.split(',').map(img => img.trim()).filter(img => img !== '');
}

/**
 * Get the first image from product images
 */
export function getFirstProductImage(product: { avatar?: string; firstImage?: string; images?: string }): string {
    if (product.avatar) return product.avatar;
    if (product.firstImage) return product.firstImage;
    if (product.images) {
        const images = parseProductImages(product.images);
        return images[0] || '';
    }
    return '';
}

/**
 * Format product images for display
 */
export function getProductImageGallery(product: { avatar?: string; firstImage?: string; images?: string }): string[] {
    const gallery: string[] = [];

    // Add avatar/first image
    const mainImage = getFirstProductImage(product);
    if (mainImage) {
        gallery.push(mainImage);
    }

    // Add other images
    if (product.images) {
        const additionalImages = parseProductImages(product.images);
        additionalImages.forEach(img => {
            if (img !== mainImage && !gallery.includes(img)) {
                gallery.push(img);
            }
        });
    }

    return gallery;
}

/**
 * Check if product has multiple images
 */
export function hasMultipleImages(product: { images?: string }): boolean {
    if (!product.images) return false;
    return parseProductImages(product.images).length > 1;
}
