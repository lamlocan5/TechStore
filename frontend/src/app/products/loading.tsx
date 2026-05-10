import { ProductGridSkeleton } from "@/components/products/ProductCardSkeleton";

export default function ProductsLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>

                <ProductGridSkeleton count={25} />
            </div>
        </div>
    );
}
