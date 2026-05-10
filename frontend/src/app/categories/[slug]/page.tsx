import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/products/ProductCard";
import { generateCategorySEO } from "@/lib/utils/seo";

// Mock category data
const categoryData = {
    laptop: { name: "Laptop", description: "Laptop cao cấp, chính hãng từ các thương hiệu hàng đầu" },
    "dien-thoai": { name: "Điện thoại", description: "Smartphone mới nhất với công nghệ tiên tiến" },
    tablet: { name: "Tablet", description: "Máy tính bảng đa năng cho công việc và giải trí" },
    "phu-kien": { name: "Phụ kiện", description: "Phụ kiện công nghệ chất lượng cao" },
    "am-thanh": { name: "Âm thanh", description: "Tai nghe, loa bluetooth chất lượng cao" },
    "dong-ho-thong-minh": { name: "Đồng hồ thông minh", description: "Smartwatch cao cấp theo dõi sức khỏe" },
};

interface CategoryPageProps {
    params: {
        slug: string;
    };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const category = categoryData[params.slug as keyof typeof categoryData];

    if (!category) {
        return { title: "Danh mục không tồn tại" };
    }

    return generateCategorySEO({
        name: category.name,
        description: category.description,
        slug: params.slug,
    });
}

export default function CategoryPage({ params }: CategoryPageProps) {
    const category = categoryData[params.slug as keyof typeof categoryData];

    if (!category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Danh mục không tồn tại</h1>
                    <Link href="/categories" className="text-primary hover:underline">
                        Quay lại danh mục
                    </Link>
                </div>
            </div>
        );
    }

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
                        <Link href="/categories" className="hover:text-foreground transition-colors">
                            Danh mục
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-medium">{category.name}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                    <p className="text-muted-foreground">{category.description}</p>
                </div>

                {/* Products will be loaded here */}
                <div className="bg-white rounded-lg border p-8 text-center">
                    <p className="text-muted-foreground">
                        Sản phẩm sẽ được hiển thị ở đây khi tích hợp API lọc theo danh mục
                    </p>
                    <Link
                        href="/products"
                        className="inline-block mt-4 text-primary hover:underline"
                    >
                        Xem tất cả sản phẩm
                    </Link>
                </div>
            </div>
        </div>
    );
}
