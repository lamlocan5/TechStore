import type { Metadata } from "next";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: string;
    canonical?: string;
}

export function generateSEO({
    title = "TechStore - Công nghệ cho mọi người",
    description = "Mua sắm sản phẩm công nghệ chính hãng với giá tốt nhất. Laptop, điện thoại, phụ kiện và nhiều hơn nữa.",
    keywords = ["công nghệ", "laptop", "điện thoại", "phụ kiện", "tech store"],
    ogImage = "/og-image.jpg",
    ogType = "website",
    canonical,
}: SEOProps = {}): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;

    return {
        title,
        description,
        keywords: keywords.join(", "),
        openGraph: {
            title,
            description,
            type: ogType as any,
            url: fullCanonical,
            images: [
                {
                    url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            siteName: "TechStore",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
        },
        alternates: {
            canonical: fullCanonical,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
    };
}

// Product-specific SEO
export function generateProductSEO(product: {
    name: string;
    shortDescription?: string;
    priceSale: number;
    images?: string[];
    slug: string;
    brand?: string;
    category?: string;
}): Metadata {
    const price = new Intl.NumberFormat("vi-VN").format(product.priceSale);
    const title = `${product.name} - Giá ${price}đ | TechStore`;
    const description = product.shortDescription
        ? product.shortDescription.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Mua ${product.name} chính hãng với giá ${price}đ tại TechStore. Bảo hành toàn quốc, giao hàng nhanh.`;

    const keywords = [
        product.name,
        product.brand || "",
        product.category || "",
        "chính hãng",
        "giá rẻ",
        "bảo hành",
    ].filter(Boolean);

    return generateSEO({
        title,
        description,
        keywords,
        ogImage: product.images?.[0] || "/og-image.jpg",
        ogType: "product",
        canonical: `/products/${product.slug}`,
    });
}

// Category-specific SEO
export function generateCategorySEO(category: {
    name: string;
    description?: string;
    slug: string;
}): Metadata {
    const title = `${category.name} - TechStore`;
    const description = category.description || `Khám phá ${category.name} chính hãng với giá tốt nhất tại TechStore.`;

    return generateSEO({
        title,
        description,
        keywords: [category.name, "chính hãng", "giá rẻ"],
        canonical: `/categories/${category.slug}`,
    });
}
