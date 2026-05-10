import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/Toaster";
import ChatWidget from "@/components/chat/ChatWidget";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "TechStore - Laptops & Mobile Phones",
    description: "Modern e-commerce platform for laptops and mobile phones",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    {children}
                </Providers>
                <Toaster />
                <ChatWidget />
            </body>
        </html>
    );
}
