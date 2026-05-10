import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { generateCategorySEO } from "@/lib/utils/seo";

// Mock categories data
const categories = [
    { id: "1", name: "Laptop", slug: "laptop", description: "Laptop cao cấp, chính hãng", productCount: 150 },
    { id: "2", name: "Điện thoại", slug: "dien-thoai", description: "Smartphone mới nhất", productCount: 200 },
    { id: "3", name: "Tablet", slug: "tablet", description: "Máy tính bảng đa năng", productCount: 80 },
    { id: "4", name: "Phụ kiện", slug: "phu-kien", description: "Phụ kiện công nghệ", productCount: 300 },
    { id: "5", name: "Âm thanh", slug: "am-thanh", description: "Tai nghe, loa bluetooth", productCount: 120 },
    { id: "6", name: "Đồng hồ thông minh", slug: "dong-ho-thong-minh", description: "Smartwatch cao cấp", productCount: 60 },
];

export const metadata: Metadata = {
    title: "Danh mục sản phẩm - TechStore",
    description: "Khám phá các danh mục sản phẩm công nghệ chính hãng tại TechStore",
};

export default function CategoriesPage() {
    return (
        <div className="min-h-screen bg-muted/30">
            <Header />

            {/* Breadcrumb */}
            <div className="border-b bg-background">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">
                            Trang chủ
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-medium">Danh mục</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Danh mục sản phẩm</h1>
                    <p className="text-muted-foreground">
                        Khám phá các danh mục sản phẩm công nghệ chính hãng
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-primary transition-all duration-300"
                        >
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {category.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {category.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    {category.productCount} sản phẩm
                                </span>
                                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
